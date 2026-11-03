import { hashPassword } from '@mtm/auth/password';
import { OPS_PERMISSIONS, PERMISSIONS } from '@mtm/contracts';

import type { PermissionType, Prisma } from '@/lib/generated/prisma';

import {
  OPS_SEED_ADMIN_ID,
  OPS_SEED_ADMIN_NAME,
  OPS_SEED_ADMIN_PASSWORD,
  OPS_SEED_ADMIN_USERNAME,
  OPS_SEED_SUPER_ROLE_CODE,
  OPS_SEED_SUPER_ROLE_ID,
  OPS_SEED_SUPER_ROLE_NAME,
} from './ids';

type OpsPermissionCode = (typeof OPS_PERMISSIONS)[number];

export interface OpsPermissionSeed {
  code: OpsPermissionCode;
  name: string;
  type: PermissionType;
  path: string | null;
  sort: number;
}

const PERMISSION_META: Record<OpsPermissionCode, Omit<OpsPermissionSeed, 'code'>> = {
  [PERMISSIONS.PRODUCT_VIEW]: { name: '商品查看', type: 'MENU', path: '/products', sort: 10 },
  [PERMISSIONS.PRODUCT_AUDIT]: { name: '商品审核', type: 'MENU', path: '/audits', sort: 20 },
  [PERMISSIONS.CATEGORY_VIEW]: { name: '类目查看', type: 'MENU', path: '/categories', sort: 30 },
  [PERMISSIONS.CATEGORY_MANAGE]: { name: '类目管理', type: 'BUTTON', path: null, sort: 31 },
  [PERMISSIONS.BRAND_MANAGE]: { name: '品牌管理', type: 'MENU', path: '/brands', sort: 40 },
  [PERMISSIONS.MERCHANT_VIEW]: { name: '商家查看', type: 'MENU', path: '/merchants', sort: 50 },
  [PERMISSIONS.SHOP_VIEW]: { name: '店铺查看', type: 'BUTTON', path: null, sort: 51 },
  [PERMISSIONS.ACCOUNT_MANAGE]: { name: '账号管理', type: 'MENU', path: '/system/accounts', sort: 60 },
  [PERMISSIONS.ROLE_MANAGE]: { name: '角色管理', type: 'MENU', path: '/system/roles', sort: 61 },
  [PERMISSIONS.PLATFORM_CROSS_TENANT]: { name: '跨商家访问', type: 'API', path: null, sort: 90 },
};

export const OPS_PERMISSION_SEEDS: readonly OpsPermissionSeed[] = OPS_PERMISSIONS.map(code => {
  const meta = PERMISSION_META[code];

  return { code, name: meta.name, type: meta.type, path: meta.path, sort: meta.sort };
});

export interface OpsMenuSeed {
  id: string;
  title: string;
  url: string;
  parentId: string;
  level: number;
  index: string;
  permissionCode: string | null;
  sortId: number;
}

const MENU_SEEDS: readonly Omit<OpsMenuSeed, 'sortId'>[] = [
  { id: 'ops-menu-dashboard', title: '仪表盘', url: '/', parentId: '-1', level: 0, index: '1', permissionCode: null },
  {
    id: 'ops-menu-products',
    title: '商品管理',
    url: '/products',
    parentId: '-1',
    level: 0,
    index: '10',
    permissionCode: PERMISSIONS.PRODUCT_VIEW,
  },
  {
    id: 'ops-menu-categories',
    title: '类目管理',
    url: '/categories',
    parentId: '-1',
    level: 0,
    index: '20',
    permissionCode: PERMISSIONS.CATEGORY_VIEW,
  },
  {
    id: 'ops-menu-brands',
    title: '品牌管理',
    url: '/brands',
    parentId: '-1',
    level: 0,
    index: '30',
    permissionCode: PERMISSIONS.BRAND_MANAGE,
  },
  {
    id: 'ops-menu-audits',
    title: '商品审核',
    url: '/audits',
    parentId: '-1',
    level: 0,
    index: '40',
    permissionCode: PERMISSIONS.PRODUCT_AUDIT,
  },
  {
    id: 'ops-menu-merchants',
    title: '商家管理',
    url: '/merchants',
    parentId: '-1',
    level: 0,
    index: '50',
    permissionCode: PERMISSIONS.MERCHANT_VIEW,
  },
  { id: 'ops-menu-system', title: '系统管理', url: '', parentId: '-1', level: 0, index: '90', permissionCode: null },
  {
    id: 'ops-menu-system-accounts',
    title: '账号管理',
    url: '/system/accounts',
    parentId: 'ops-menu-system',
    level: 1,
    index: '1',
    permissionCode: PERMISSIONS.ACCOUNT_MANAGE,
  },
  {
    id: 'ops-menu-system-roles',
    title: '角色管理',
    url: '/system/roles',
    parentId: 'ops-menu-system',
    level: 1,
    index: '2',
    permissionCode: PERMISSIONS.ROLE_MANAGE,
  },
];

export const OPS_MENU_SEEDS: readonly OpsMenuSeed[] = MENU_SEEDS.map(menu => ({
  id: menu.id,
  title: menu.title,
  url: menu.url,
  parentId: menu.parentId,
  level: menu.level,
  index: menu.index,
  permissionCode: menu.permissionCode,
  sortId: Number(menu.index),
}));

/**
 * Writes ops permissions, the built-in super-admin role, the bootstrap admin
 * account and menu items. Every row is upserted so repeated runs are safe, and
 * the admin password is only hashed when the account is first created.
 */
export async function seedOpsAuth(tx: Prisma.TransactionClient): Promise<void> {
  const permissions = await Promise.all(
    OPS_PERMISSION_SEEDS.map(permission =>
      tx.opsPermission.upsert({
        where: { code: permission.code },
        update: {
          name: permission.name,
          type: permission.type,
          path: permission.path,
          sort: permission.sort,
        },
        create: {
          code: permission.code,
          name: permission.name,
          type: permission.type,
          path: permission.path,
          sort: permission.sort,
        },
      })
    )
  );
  const permissionIds = permissions.map(permission => permission.id);

  const role = await tx.opsRole.upsert({
    where: { code: OPS_SEED_SUPER_ROLE_CODE },
    update: { name: OPS_SEED_SUPER_ROLE_NAME },
    create: {
      id: OPS_SEED_SUPER_ROLE_ID,
      code: OPS_SEED_SUPER_ROLE_CODE,
      name: OPS_SEED_SUPER_ROLE_NAME,
    },
  });

  await tx.opsRolePermission.deleteMany({ where: { roleId: role.id } });
  await tx.opsRolePermission.createMany({
    data: permissionIds.map(permissionId => ({ roleId: role.id, permissionId })),
    skipDuplicates: true,
  });

  const existingAdmin = await tx.opsAccount.findUnique({ where: { username: OPS_SEED_ADMIN_USERNAME } });

  const admin = existingAdmin
    ? await tx.opsAccount.update({
        where: { username: OPS_SEED_ADMIN_USERNAME },
        data: { name: OPS_SEED_ADMIN_NAME },
      })
    : await tx.opsAccount.create({
        data: {
          id: OPS_SEED_ADMIN_ID,
          username: OPS_SEED_ADMIN_USERNAME,
          name: OPS_SEED_ADMIN_NAME,
          passwordHash: await hashPassword(OPS_SEED_ADMIN_PASSWORD),
        },
      });

  await tx.opsAccountRole.upsert({
    where: { accountId_roleId: { accountId: admin.id, roleId: role.id } },
    update: {},
    create: { accountId: admin.id, roleId: role.id },
  });

  await Promise.all(
    OPS_MENU_SEEDS.map(menu =>
      tx.opsMenuItem.upsert({
        where: { id: menu.id },
        update: {
          parentId: menu.parentId,
          title: menu.title,
          url: menu.url,
          index: menu.index,
          level: menu.level,
          sortId: menu.sortId,
          permissionCode: menu.permissionCode,
        },
        create: {
          id: menu.id,
          parentId: menu.parentId,
          title: menu.title,
          url: menu.url,
          index: menu.index,
          level: menu.level,
          sortId: menu.sortId,
          permissionCode: menu.permissionCode,
        },
      })
    )
  );
}
