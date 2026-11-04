import { MERCHANT_PERMISSIONS } from '@mtm/contracts';
import { afterAll, beforeEach, expect, test } from 'vitest';

import { initDatabase, prisma } from '@/lib/db';
import { SEED_ACCOUNT_ID, SEED_MERCHANT_ID } from '@/lib/db/seed/ids';
import { createRole, listPermissions, listRoles, updateRole } from '@/lib/services/role-admin';

const TEST_ROLE_CODES = ['test-role-create', 'test-role-invalid', 'test-role-dup', 'test-role-update'];
const createdRoleIds = new Set<string>();
const crossMerchantRoleIds = new Set<string>();

async function removeTestRows(): Promise<void> {
  const roles = await prisma.merchantRole.findMany({
    where: { code: { in: TEST_ROLE_CODES } },
    select: { id: true },
  });
  for (const row of roles) {
    createdRoleIds.add(row.id);
  }

  const roleIds = [...createdRoleIds];
  const crossIds = [...crossMerchantRoleIds];

  if (roleIds.length > 0) {
    await prisma.merchantOperationLog.deleteMany({ where: { resource: 'merchant-role', resourceId: { in: roleIds } } });
    await prisma.merchantRolePermission.deleteMany({ where: { roleId: { in: roleIds } } });
    await prisma.merchantAccountRole.deleteMany({ where: { roleId: { in: roleIds } } });
    await prisma.merchantRole.deleteMany({ where: { id: { in: roleIds } } });
  }

  if (crossIds.length > 0) {
    await prisma.merchantRole.deleteMany({ where: { id: { in: crossIds } } });
  }
}

beforeEach(async () => {
  await initDatabase();
});

afterAll(async () => {
  await removeTestRows();
  await prisma.$disconnect();
});

test('creates a role scoped to the merchant and logs the operation', async () => {
  const role = await createRole(
    SEED_MERCHANT_ID,
    { code: 'test-role-create', name: '测试角色', permissionCodes: ['product:create', 'product:view'] },
    SEED_ACCOUNT_ID
  );
  createdRoleIds.add(role.id);

  expect(role.code).toBe('test-role-create');
  expect(role.name).toBe('测试角色');
  expect(role.permissions).toEqual(['product:create', 'product:view']);
  expect(role.accountCount).toBe(0);
  expect(await prisma.merchantOperationLog.count({ where: { resourceId: role.id, action: 'create' } })).toBe(1);

  const roles = await listRoles(SEED_MERCHANT_ID);
  expect(roles.some(item => item.id === role.id)).toBe(true);
});

test('rejects permission codes outside MERCHANT_PERMISSIONS', async () => {
  await expect(
    createRole(
      SEED_MERCHANT_ID,
      { code: 'test-role-invalid', name: '非法权限', permissionCodes: ['platform:cross-tenant'] },
      SEED_ACCOUNT_ID
    )
  ).rejects.toMatchObject({ code: 'INVALID_PERMISSION', status: 400 });
  expect(await prisma.merchantRole.count({ where: { code: 'test-role-invalid' } })).toBe(0);
});

test('keeps roles from other merchants invisible', async () => {
  const other = await prisma.merchantRole.create({
    data: { merchantId: '2', code: 'test-role-create', name: '其他商家角色' },
  });
  crossMerchantRoleIds.add(other.id);

  const roles = await listRoles(SEED_MERCHANT_ID);
  expect(roles.some(item => item.id === other.id)).toBe(false);

  await expect(updateRole(SEED_MERCHANT_ID, other.id, { name: '越权修改' }, SEED_ACCOUNT_ID)).rejects.toMatchObject({
    code: 'ROLE_NOT_FOUND',
    status: 404,
  });
});

test('rejects duplicate role codes within the same merchant', async () => {
  const role = await createRole(
    SEED_MERCHANT_ID,
    { code: 'test-role-dup', name: '重复角色', permissionCodes: ['product:view'] },
    SEED_ACCOUNT_ID
  );
  createdRoleIds.add(role.id);

  await expect(
    createRole(
      SEED_MERCHANT_ID,
      { code: 'test-role-dup', name: '重复角色', permissionCodes: ['product:view'] },
      SEED_ACCOUNT_ID
    )
  ).rejects.toMatchObject({ code: 'ROLE_CODE_TAKEN', status: 409 });
});

test('updates role name and permissions without changing the code', async () => {
  const role = await createRole(
    SEED_MERCHANT_ID,
    { code: 'test-role-update', name: '可编辑角色', permissionCodes: ['product:view'] },
    SEED_ACCOUNT_ID
  );
  createdRoleIds.add(role.id);

  const updated = await updateRole(
    SEED_MERCHANT_ID,
    role.id,
    { name: '已编辑角色', permissionCodes: ['product:publish', 'product:view'] },
    SEED_ACCOUNT_ID
  );

  expect(updated.code).toBe('test-role-update');
  expect(updated.name).toBe('已编辑角色');
  expect(updated.permissions).toEqual(['product:publish', 'product:view']);
  expect(await prisma.merchantOperationLog.count({ where: { resourceId: role.id, action: 'update' } })).toBe(1);
});

test('lets only owners mutate roles', async () => {
  const { SEED_STAFF_ACCOUNT_ID } = await import('@/lib/db/seed/ids');

  await expect(
    createRole(
      SEED_MERCHANT_ID,
      { code: 'test-role-create', name: '无权限', permissionCodes: ['product:view'] },
      SEED_STAFF_ACCOUNT_ID
    )
  ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
});

test('lists the seeded merchant permissions', async () => {
  const permissions = await listPermissions();
  expect(permissions).toHaveLength(MERCHANT_PERMISSIONS.length);
  expect(permissions.map(item => item.code)).toContain('account:manage');
  expect(permissions[0]).toEqual(
    expect.objectContaining({
      code: expect.any(String),
      name: expect.any(String),
      type: expect.any(String),
      path: expect.anything(),
      sort: expect.any(Number),
    })
  );
});
