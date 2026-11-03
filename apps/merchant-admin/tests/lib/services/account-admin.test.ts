import { afterAll, beforeEach, expect, test } from 'vitest';

import { initDatabase, prisma } from '@/lib/db';
import { SEED_ACCOUNT_ID, SEED_MERCHANT_ID, SEED_STAFF_ACCOUNT_ID } from '@/lib/db/seed/ids';
import { createAccount, listAccounts, resetAccountPassword, updateAccount } from '@/lib/services/account-admin';

const TEST_USERNAMES = ['merchant-test-staff', 'x1', 'x2', 'merchant-update-staff', 'merchant-reset-staff'];
const createdAccountIds = new Set<string>();
const createdRoleIds = new Set<string>();

async function removeTestRows(): Promise<void> {
  const accounts = await prisma.merchantAccount.findMany({
    where: { username: { in: TEST_USERNAMES } },
    select: { id: true },
  });
  const roles = await prisma.merchantRole.findMany({
    where: { merchantId: '2', code: 'other' },
    select: { id: true },
  });

  for (const row of accounts) {
    createdAccountIds.add(row.id);
  }
  for (const row of roles) {
    createdRoleIds.add(row.id);
  }

  const accountIds = [...createdAccountIds];
  const roleIds = [...createdRoleIds];

  if (accountIds.length > 0) {
    await prisma.merchantOperationLog.deleteMany({ where: { resourceId: { in: accountIds } } });
    await prisma.merchantAccountRole.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.merchantAccount.deleteMany({ where: { id: { in: accountIds } } });
  }

  if (roleIds.length > 0) {
    await prisma.merchantRolePermission.deleteMany({ where: { roleId: { in: roleIds } } });
    await prisma.merchantAccountRole.deleteMany({ where: { roleId: { in: roleIds } } });
    await prisma.merchantRole.deleteMany({ where: { id: { in: roleIds } } });
  }
}

beforeEach(async () => {
  await initDatabase();
});

afterAll(async () => {
  await removeTestRows();
  await prisma.$disconnect();
});

test('owner creates a sub-account scoped to their merchant', async () => {
  await initDatabase();
  const role = await prisma.merchantRole.findUniqueOrThrow({
    where: { merchantId_code: { merchantId: SEED_MERCHANT_ID, code: 'staff' } },
  });
  const account = await createAccount(SEED_ACCOUNT_ID, SEED_MERCHANT_ID, {
    username: 'merchant-test-staff',
    name: '测试子账号',
    password: 'password123',
    roleIds: [role.id],
  });
  createdAccountIds.add(account.id);

  expect(account.username).toBe('merchant-test-staff');
  expect(account.isOwner).toBe(false);
  expect(account.roles.map(item => item.code)).toEqual(['staff']);
  expect(await prisma.merchantOperationLog.count({ where: { resourceId: account.id } })).toBe(1);
});

test('non-owner actors and owner targets are rejected', async () => {
  await initDatabase();
  await expect(
    createAccount(SEED_STAFF_ACCOUNT_ID, SEED_MERCHANT_ID, {
      username: 'x1',
      name: 'x',
      password: 'password123',
      roleIds: [],
    })
  ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
  await expect(
    updateAccount(SEED_ACCOUNT_ID, SEED_MERCHANT_ID, SEED_ACCOUNT_ID, { name: '改主账号' })
  ).rejects.toMatchObject({
    code: 'OWNER_IMMUTABLE',
    status: 403,
  });
  await expect(
    resetAccountPassword(SEED_ACCOUNT_ID, SEED_MERCHANT_ID, SEED_ACCOUNT_ID, 'new-password-123')
  ).rejects.toMatchObject({ code: 'OWNER_IMMUTABLE', status: 403 });
});

test('roles from another merchant are rejected', async () => {
  await initDatabase();
  const other = await prisma.merchantRole.create({
    data: { merchantId: '2', code: 'other', name: '其他商家角色' },
  });
  createdRoleIds.add(other.id);

  await expect(
    createAccount(SEED_ACCOUNT_ID, SEED_MERCHANT_ID, {
      username: 'x2',
      name: 'x',
      password: 'password123',
      roleIds: [other.id],
    })
  ).rejects.toMatchObject({ code: 'INVALID_ROLE', status: 400 });
});

test('updates a sub-account, lists it, and writes an update log', async () => {
  await initDatabase();
  const role = await prisma.merchantRole.findUniqueOrThrow({
    where: { merchantId_code: { merchantId: SEED_MERCHANT_ID, code: 'staff' } },
  });
  const account = await createAccount(SEED_ACCOUNT_ID, SEED_MERCHANT_ID, {
    username: 'merchant-update-staff',
    name: '待更新子账号',
    password: 'password123',
    roleIds: [role.id],
  });
  createdAccountIds.add(account.id);

  const updated = await updateAccount(SEED_ACCOUNT_ID, SEED_MERCHANT_ID, account.id, {
    name: '已更新子账号',
    status: 'DISABLED',
    roleIds: [],
  });

  expect(updated.name).toBe('已更新子账号');
  expect(updated.status).toBe('DISABLED');
  expect(updated.roles).toEqual([]);
  expect(updated.phone).toBeNull();
  expect(updated.interCode).toBe('86');
  expect(updated.isOwner).toBe(false);
  expect(typeof updated.createdAt).toBe('string');
  expect(await prisma.merchantOperationLog.count({ where: { resourceId: account.id, action: 'update' } })).toBe(1);

  const disabled = await listAccounts(SEED_MERCHANT_ID, {
    page: 1,
    pageSize: 10,
    status: 'DISABLED',
    keyword: 'UPDATE-STAFF',
  });
  expect(disabled.items.some(item => item.id === account.id)).toBe(true);
  expect(disabled.total).toBeGreaterThanOrEqual(1);

  const active = await listAccounts(SEED_MERCHANT_ID, {
    page: 1,
    pageSize: 10,
    status: 'ACTIVE',
    keyword: 'merchant-update-staff',
  });
  expect(active.items.some(item => item.id === account.id)).toBe(false);
});

test('resets a sub-account password without logging the plaintext', async () => {
  await initDatabase();
  const { verifyPassword } = await import('@mtm/auth/password');
  const account = await createAccount(SEED_ACCOUNT_ID, SEED_MERCHANT_ID, {
    username: 'merchant-reset-staff',
    name: '重置密码子账号',
    password: 'password123',
    roleIds: [],
  });
  createdAccountIds.add(account.id);

  await resetAccountPassword(SEED_ACCOUNT_ID, SEED_MERCHANT_ID, account.id, 'new-password-123');

  const row = await prisma.merchantAccount.findUniqueOrThrow({ where: { id: account.id } });
  expect(await verifyPassword(row.passwordHash!, 'new-password-123')).toBe(true);

  const log = await prisma.merchantOperationLog.findFirstOrThrow({
    where: { resourceId: account.id, action: 'reset-password' },
  });
  expect(JSON.stringify(log.detail)).not.toContain('new-password-123');
});

test('rejects a duplicate username', async () => {
  await initDatabase();
  await expect(
    createAccount(SEED_ACCOUNT_ID, SEED_MERCHANT_ID, {
      username: 'merchant@example.com',
      name: 'x',
      password: 'password123',
      roleIds: [],
    })
  ).rejects.toMatchObject({ code: 'USERNAME_TAKEN', status: 409 });
});
