import { verifyPassword } from '@mtm/auth/password';
import { afterAll, beforeEach, expect, test } from 'vitest';

import { initDatabase } from '@/lib/db';
import { prisma } from '@/lib/db/client';
import { OPS_SEED_ADMIN_ID } from '@/lib/db/seed/ids';
import { createAccount, listAccounts, resetAccountPassword, updateAccount } from '@/lib/services/account-admin';

const TEST_USERNAMES = ['ops-test-user', 'ops-update-user', 'ops-actor', 'ops-last-super', 'ops-reset-user'];
const createdAccountIds = new Set<string>();

async function removeTestAccounts(): Promise<void> {
  const rows = await prisma.opsAccount.findMany({
    where: { username: { in: TEST_USERNAMES } },
    select: { id: true },
  });

  for (const row of rows) {
    createdAccountIds.add(row.id);
  }

  const accountIds = [...createdAccountIds];

  if (accountIds.length === 0) {
    return;
  }

  // Cleanup order: logs, then associations, then accounts. Seeded rows are
  // excluded by both the username list and the captured id set.
  await prisma.opsOperationLog.deleteMany({ where: { resource: 'ops-account', resourceId: { in: accountIds } } });
  await prisma.opsAccountRole.deleteMany({ where: { accountId: { in: accountIds } } });
  await prisma.opsAccount.deleteMany({ where: { id: { in: accountIds } } });
}

beforeEach(async () => {
  await initDatabase();
});

afterAll(async () => {
  await removeTestAccounts();
  await prisma.$disconnect();
});

test('creates a sub-account with roles and logs the operation', async () => {
  await initDatabase();
  const role = await prisma.opsRole.findUniqueOrThrow({ where: { code: 'super-admin' } });
  const account = await createAccount(OPS_SEED_ADMIN_ID, {
    username: 'ops-test-user',
    name: '测试运营',
    password: 'password123',
    roleIds: [role.id],
  });
  createdAccountIds.add(account.id);
  expect(account.username).toBe('ops-test-user');
  expect(account.roles.map(item => item.code)).toEqual(['super-admin']);
  expect(await prisma.opsOperationLog.count({ where: { resource: 'ops-account', resourceId: account.id } })).toBe(1);
  // The role link has no cascade, so remove it before deleting the account.
  await prisma.opsAccountRole.deleteMany({ where: { accountId: account.id } });
  await prisma.opsAccount.delete({ where: { id: account.id } });
});

test('rejects duplicate usernames, invalid roles and self-disable', async () => {
  await initDatabase();
  await expect(
    createAccount(OPS_SEED_ADMIN_ID, { username: 'admin', name: 'x', password: 'password123', roleIds: [] })
  ).rejects.toMatchObject({ code: 'USERNAME_TAKEN', status: 409 });
  await expect(updateAccount(OPS_SEED_ADMIN_ID, OPS_SEED_ADMIN_ID, { status: 'DISABLED' })).rejects.toMatchObject({
    code: 'SELF_DISABLE_FORBIDDEN',
    status: 403,
  });
  await expect(
    createAccount(OPS_SEED_ADMIN_ID, {
      username: 'ops-update-user',
      name: '测试',
      password: 'password123',
      roleIds: ['role-does-not-exist'],
    })
  ).rejects.toMatchObject({ code: 'INVALID_ROLE', status: 400 });
});

test('updates accounts, lists with keyword/status filters, and writes an update log', async () => {
  const account = await createAccount(OPS_SEED_ADMIN_ID, {
    username: 'ops-update-user',
    name: '待更新运营',
    password: 'password123',
    roleIds: [],
  });
  createdAccountIds.add(account.id);

  const updated = await updateAccount(OPS_SEED_ADMIN_ID, account.id, { name: '已更新运营', status: 'DISABLED' });
  expect(updated.name).toBe('已更新运营');
  expect(updated.status).toBe('DISABLED');
  expect(typeof updated.createdAt).toBe('string');
  expect(await prisma.opsOperationLog.count({ where: { resourceId: account.id, action: 'update' } })).toBe(1);

  const byStatus = await listAccounts({ page: 1, pageSize: 10, status: 'DISABLED', keyword: 'OPS-UPDATE' });
  expect(byStatus.items.some(item => item.id === account.id)).toBe(true);
  expect(byStatus.total).toBeGreaterThanOrEqual(1);

  const activeOnly = await listAccounts({ page: 1, pageSize: 10, status: 'ACTIVE', keyword: 'ops-update-user' });
  expect(activeOnly.items.some(item => item.id === account.id)).toBe(false);
});

test('prevents removing the last active super admin', async () => {
  const actor = await createAccount(OPS_SEED_ADMIN_ID, {
    username: 'ops-actor',
    name: '操作员',
    password: 'password123',
    roleIds: [],
  });
  createdAccountIds.add(actor.id);

  await expect(updateAccount(actor.id, OPS_SEED_ADMIN_ID, { roleIds: [] })).rejects.toMatchObject({
    code: 'LAST_SUPER_ADMIN',
    status: 409,
  });

  const superRole = await prisma.opsRole.findUniqueOrThrow({ where: { code: 'super-admin' } });
  const second = await createAccount(OPS_SEED_ADMIN_ID, {
    username: 'ops-last-super',
    name: '第二超管',
    password: 'password123',
    roleIds: [superRole.id],
  });
  createdAccountIds.add(second.id);

  // With another active super admin present, demoting the second one is allowed.
  const demoted = await updateAccount(actor.id, second.id, { roleIds: [] });
  expect(demoted.roles).toEqual([]);
});

test('rejects clearing the roles of the only super admin', async () => {
  const superRole = await prisma.opsRole.findUniqueOrThrow({ where: { code: 'super-admin' } });

  // The seeded admin is the only active super admin at this point, so the
  // LAST_SUPER_ADMIN guard must fire instead of leaving the system unmanageable.
  await expect(updateAccount(OPS_SEED_ADMIN_ID, OPS_SEED_ADMIN_ID, { roleIds: [] })).rejects.toMatchObject({
    code: 'LAST_SUPER_ADMIN',
    status: 409,
  });

  const seededRoles = await prisma.opsAccountRole.findMany({
    where: { accountId: OPS_SEED_ADMIN_ID },
    select: { roleId: true },
  });
  expect(seededRoles.map(item => item.roleId)).toEqual([superRole.id]);
});

test('resets the password without logging the plaintext', async () => {
  const account = await createAccount(OPS_SEED_ADMIN_ID, {
    username: 'ops-reset-user',
    name: '重置密码',
    password: 'password123',
    roleIds: [],
  });
  createdAccountIds.add(account.id);

  await resetAccountPassword(OPS_SEED_ADMIN_ID, account.id, 'new-password-123');

  const row = await prisma.opsAccount.findUniqueOrThrow({ where: { id: account.id } });
  expect(await verifyPassword(row.passwordHash, 'new-password-123')).toBe(true);
  expect(await verifyPassword(row.passwordHash, 'password123')).toBe(false);

  const log = await prisma.opsOperationLog.findFirstOrThrow({
    where: { resourceId: account.id, action: 'reset-password' },
  });
  expect(JSON.stringify(log.detail)).not.toContain('new-password-123');
});
