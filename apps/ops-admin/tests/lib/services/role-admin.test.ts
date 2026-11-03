import { afterAll, beforeEach, expect, test } from 'vitest';

import { initDatabase } from '@/lib/db';
import { prisma } from '@/lib/db/client';
import { OPS_SEED_ADMIN_ID } from '@/lib/db/seed/ids';
import { createRole, listPermissions, listRoles, updateRole } from '@/lib/services/role-admin';

const TEST_ROLE_CODES = ['scoped-role', 'invalid-perm-role', 'duplicate-role', 'cross-tenant-role', 'mutable-role'];
const createdRoleIds = new Set<string>();

async function removeTestRoles(): Promise<void> {
  const rows = await prisma.opsRole.findMany({
    where: { code: { in: TEST_ROLE_CODES } },
    select: { id: true },
  });

  for (const row of rows) {
    createdRoleIds.add(row.id);
  }

  const roleIds = [...createdRoleIds];

  if (roleIds.length === 0) {
    return;
  }

  // Cleanup order: logs, then role associations, then roles.
  await prisma.opsOperationLog.deleteMany({ where: { resource: 'ops-role', resourceId: { in: roleIds } } });
  await prisma.opsRolePermission.deleteMany({ where: { roleId: { in: roleIds } } });
  await prisma.opsRoleMerchantScope.deleteMany({ where: { roleId: { in: roleIds } } });
  await prisma.opsRole.deleteMany({ where: { id: { in: roleIds } } });
}

beforeEach(async () => {
  await initDatabase();
});

afterAll(async () => {
  await removeTestRoles();
  await prisma.$disconnect();
});

test('creates a role with permissions and a deduplicated merchant scope', async () => {
  const role = await createRole(OPS_SEED_ADMIN_ID, {
    code: 'scoped-role',
    name: '受限角色',
    permissionCodes: ['merchant:view', 'product:view'],
    merchantScope: ['m1', 'm1', 'm2'],
  });
  createdRoleIds.add(role.id);

  expect(role.code).toBe('scoped-role');
  expect(role.permissions).toEqual(['merchant:view', 'product:view']);
  expect(role.merchantScope).toEqual(['m1', 'm2']);
  expect(role.accountCount).toBe(0);
  expect(await prisma.opsOperationLog.count({ where: { resourceId: role.id, action: 'create' } })).toBe(1);

  const roles = await listRoles();
  expect(roles.some(item => item.id === role.id)).toBe(true);
});

test('rejects unknown permission codes', async () => {
  await expect(
    createRole(OPS_SEED_ADMIN_ID, {
      code: 'invalid-perm-role',
      name: '非法权限',
      permissionCodes: ['not:a-permission'],
      merchantScope: [],
    })
  ).rejects.toMatchObject({ code: 'INVALID_PERMISSION', status: 400 });
  expect(await prisma.opsRole.count({ where: { code: 'invalid-perm-role' } })).toBe(0);
});

test('clears merchant scope when the role can cross tenants', async () => {
  const role = await createRole(OPS_SEED_ADMIN_ID, {
    code: 'cross-tenant-role',
    name: '跨商家角色',
    permissionCodes: ['product:view', 'platform:cross-tenant'],
    merchantScope: ['m1'],
  });
  createdRoleIds.add(role.id);

  expect(role.permissions).toContain('platform:cross-tenant');
  expect(role.merchantScope).toEqual([]);
});

test('rejects duplicate role codes', async () => {
  const role = await createRole(OPS_SEED_ADMIN_ID, {
    code: 'duplicate-role',
    name: '重复角色',
    permissionCodes: ['product:view'],
    merchantScope: [],
  });
  createdRoleIds.add(role.id);

  await expect(
    createRole(OPS_SEED_ADMIN_ID, {
      code: 'duplicate-role',
      name: '重复角色',
      permissionCodes: ['product:view'],
      merchantScope: [],
    })
  ).rejects.toMatchObject({ code: 'ROLE_CODE_TAKEN', status: 409 });
});

test('updates role name, permissions and scope without changing the code', async () => {
  const role = await createRole(OPS_SEED_ADMIN_ID, {
    code: 'mutable-role',
    name: '可编辑角色',
    permissionCodes: ['product:view'],
    merchantScope: ['m1'],
  });
  createdRoleIds.add(role.id);

  const updated = await updateRole(OPS_SEED_ADMIN_ID, role.id, {
    name: '已编辑角色',
    permissionCodes: ['merchant:view'],
    merchantScope: ['m2', 'm3', 'm3'],
  });

  expect(updated.code).toBe('mutable-role');
  expect(updated.name).toBe('已编辑角色');
  expect(updated.permissions).toEqual(['merchant:view']);
  expect(updated.merchantScope).toEqual(['m2', 'm3']);
  expect(await prisma.opsOperationLog.count({ where: { resourceId: role.id, action: 'update' } })).toBe(1);
});

test('lists the ten seeded ops permissions', async () => {
  const permissions = await listPermissions();
  expect(permissions).toHaveLength(10);
  expect(permissions.map(item => item.code)).toContain('platform:cross-tenant');
  expect(permissions[0]).toEqual(
    expect.objectContaining({ code: expect.any(String), name: expect.any(String), type: expect.any(String) })
  );
});
