import { hashPassword } from '@mtm/auth/password';
import { MERCHANT_PERMISSIONS, PERMISSIONS } from '@mtm/contracts';

import type { PermissionType, Prisma } from '@/lib/generated/prisma';

import {
  MERCHANT_OWNER_NAME,
  MERCHANT_OWNER_PASSWORD,
  MERCHANT_OWNER_USERNAME,
  MERCHANT_STAFF_NAME,
  MERCHANT_STAFF_PASSWORD,
  MERCHANT_STAFF_PHONE,
  MERCHANT_STAFF_USERNAME,
  SEED_ACCOUNT_ID,
  SEED_MERCHANT_ID,
  SEED_OWNER_ROLE_CODE,
  SEED_OWNER_ROLE_ID,
  SEED_OWNER_ROLE_NAME,
  SEED_STAFF_ACCOUNT_ID,
  SEED_STAFF_ROLE_CODE,
  SEED_STAFF_ROLE_ID,
  SEED_STAFF_ROLE_NAME,
} from './ids';

type MerchantPermissionCode = (typeof MERCHANT_PERMISSIONS)[number];

export interface MerchantPermissionSeed {
  code: MerchantPermissionCode;
  name: string;
  type: PermissionType;
  path: string | null;
  sort: number;
}

const PERMISSION_META: Record<MerchantPermissionCode, Omit<MerchantPermissionSeed, 'code'>> = {
  [PERMISSIONS.PRODUCT_VIEW]: { name: '商品查看', type: 'MENU', path: '/products', sort: 10 },
  [PERMISSIONS.PRODUCT_CREATE]: { name: '商品创建', type: 'BUTTON', path: null, sort: 20 },
  [PERMISSIONS.PRODUCT_UPDATE]: { name: '商品编辑', type: 'BUTTON', path: null, sort: 30 },
  [PERMISSIONS.PRODUCT_DELETE]: { name: '商品删除', type: 'BUTTON', path: null, sort: 40 },
  [PERMISSIONS.PRODUCT_SUBMIT]: { name: '商品提交', type: 'BUTTON', path: null, sort: 50 },
  [PERMISSIONS.PRODUCT_PUBLISH]: { name: '商品发布', type: 'BUTTON', path: null, sort: 60 },
  [PERMISSIONS.MERCHANT_UPDATE]: { name: '商家信息维护', type: 'MENU', path: '/shop/admin', sort: 70 },
  [PERMISSIONS.SHOP_UPDATE]: { name: '店铺设置', type: 'BUTTON', path: null, sort: 80 },
  [PERMISSIONS.ACCOUNT_MANAGE]: { name: '账号管理', type: 'MENU', path: '/staff/sub-account', sort: 90 },
  [PERMISSIONS.ROLE_MANAGE]: { name: '角色管理', type: 'MENU', path: '/system/roles', sort: 100 },
};

export const MERCHANT_PERMISSION_SEEDS: readonly MerchantPermissionSeed[] = MERCHANT_PERMISSIONS.map(code => ({
  code,
  ...PERMISSION_META[code],
}));

const STAFF_PERMISSION_CODES: readonly MerchantPermissionCode[] = [
  PERMISSIONS.PRODUCT_VIEW,
  PERMISSIONS.PRODUCT_CREATE,
  PERMISSIONS.PRODUCT_UPDATE,
  PERMISSIONS.PRODUCT_SUBMIT,
  PERMISSIONS.SHOP_UPDATE,
];

export interface MerchantMenuSeed {
  id: string;
  title: string;
  url: string;
  parentId: string;
  level: number;
  index: string;
  permissionCode: string | null;
  sortId: number;
}

export const MERCHANT_MENU_SEEDS: readonly MerchantMenuSeed[] = [
  {
    id: 'seed-menu-system',
    title: '系统管理',
    url: '',
    parentId: '-1',
    level: 0,
    index: '200',
    permissionCode: null,
    sortId: 200,
  },
  {
    id: 'seed-menu-accounts',
    title: '账号管理',
    url: '/system/accounts',
    parentId: 'seed-menu-system',
    level: 1,
    index: '1',
    permissionCode: PERMISSIONS.ACCOUNT_MANAGE,
    sortId: 1,
  },
  {
    id: 'seed-menu-roles',
    title: '角色管理',
    url: '/system/roles',
    parentId: 'seed-menu-system',
    level: 1,
    index: '2',
    permissionCode: PERMISSIONS.ROLE_MANAGE,
    sortId: 2,
  },
];

/**
 * Writes merchant permissions, the owner/staff roles, both demo accounts and
 * the system-management menus. Every row is upserted so repeated runs are safe;
 * passwords are hashed only when an account is created or has no hash yet.
 */
export async function seedMerchantAuth(tx: Prisma.TransactionClient): Promise<void> {
  const permissions = await Promise.all(
    MERCHANT_PERMISSION_SEEDS.map(permission =>
      tx.merchantPermission.upsert({
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
  const permissionIdByCode = new Map(permissions.map(permission => [permission.code, permission.id]));

  const ownerRole = await tx.merchantRole.upsert({
    where: { merchantId_code: { merchantId: SEED_MERCHANT_ID, code: SEED_OWNER_ROLE_CODE } },
    update: { name: SEED_OWNER_ROLE_NAME },
    create: {
      id: SEED_OWNER_ROLE_ID,
      merchantId: SEED_MERCHANT_ID,
      code: SEED_OWNER_ROLE_CODE,
      name: SEED_OWNER_ROLE_NAME,
    },
  });
  const ownerPermissionIds = MERCHANT_PERMISSIONS.map(code => permissionIdByCode.get(code)!).filter(Boolean);

  await tx.merchantRolePermission.deleteMany({ where: { roleId: ownerRole.id } });
  await tx.merchantRolePermission.createMany({
    data: ownerPermissionIds.map(permissionId => ({ roleId: ownerRole.id, permissionId })),
    skipDuplicates: true,
  });

  const staffRole = await tx.merchantRole.upsert({
    where: { merchantId_code: { merchantId: SEED_MERCHANT_ID, code: SEED_STAFF_ROLE_CODE } },
    update: { name: SEED_STAFF_ROLE_NAME },
    create: {
      id: SEED_STAFF_ROLE_ID,
      merchantId: SEED_MERCHANT_ID,
      code: SEED_STAFF_ROLE_CODE,
      name: SEED_STAFF_ROLE_NAME,
    },
  });
  const staffPermissionIds = STAFF_PERMISSION_CODES.map(code => permissionIdByCode.get(code)!).filter(Boolean);

  await tx.merchantRolePermission.deleteMany({ where: { roleId: staffRole.id } });
  await tx.merchantRolePermission.createMany({
    data: staffPermissionIds.map(permissionId => ({ roleId: staffRole.id, permissionId })),
    skipDuplicates: true,
  });

  const existingOwner = await tx.merchantAccount.findUnique({ where: { id: SEED_ACCOUNT_ID } });

  if (existingOwner) {
    await tx.merchantAccount.update({
      where: { id: SEED_ACCOUNT_ID },
      data: {
        merchantId: SEED_MERCHANT_ID,
        username: MERCHANT_OWNER_USERNAME,
        name: MERCHANT_OWNER_NAME,
        isOwner: true,
        status: 'ACTIVE',
        ...(existingOwner.passwordHash ? {} : { passwordHash: await hashPassword(MERCHANT_OWNER_PASSWORD) }),
      },
    });
  } else {
    await tx.merchantAccount.create({
      data: {
        id: SEED_ACCOUNT_ID,
        merchantId: SEED_MERCHANT_ID,
        username: MERCHANT_OWNER_USERNAME,
        passwordHash: await hashPassword(MERCHANT_OWNER_PASSWORD),
        name: MERCHANT_OWNER_NAME,
        phone: '13412345678',
        interCode: '86',
        isOwner: true,
        status: 'ACTIVE',
      },
    });
  }

  await tx.merchantAccountRole.upsert({
    where: { accountId_roleId: { accountId: SEED_ACCOUNT_ID, roleId: ownerRole.id } },
    update: {},
    create: { accountId: SEED_ACCOUNT_ID, roleId: ownerRole.id },
  });

  const existingStaff = await tx.merchantAccount.findUnique({ where: { id: SEED_STAFF_ACCOUNT_ID } });

  if (existingStaff) {
    await tx.merchantAccount.update({
      where: { id: SEED_STAFF_ACCOUNT_ID },
      data: {
        merchantId: SEED_MERCHANT_ID,
        username: MERCHANT_STAFF_USERNAME,
        name: MERCHANT_STAFF_NAME,
        phone: MERCHANT_STAFF_PHONE,
        interCode: '86',
        isOwner: false,
        status: 'ACTIVE',
        ...(existingStaff.passwordHash ? {} : { passwordHash: await hashPassword(MERCHANT_STAFF_PASSWORD) }),
      },
    });
  } else {
    await tx.merchantAccount.create({
      data: {
        id: SEED_STAFF_ACCOUNT_ID,
        merchantId: SEED_MERCHANT_ID,
        username: MERCHANT_STAFF_USERNAME,
        passwordHash: await hashPassword(MERCHANT_STAFF_PASSWORD),
        name: MERCHANT_STAFF_NAME,
        phone: MERCHANT_STAFF_PHONE,
        interCode: '86',
        isOwner: false,
        status: 'ACTIVE',
      },
    });
  }

  await tx.merchantAccountRole.upsert({
    where: { accountId_roleId: { accountId: SEED_STAFF_ACCOUNT_ID, roleId: staffRole.id } },
    update: {},
    create: { accountId: SEED_STAFF_ACCOUNT_ID, roleId: staffRole.id },
  });

  await Promise.all(
    MERCHANT_MENU_SEEDS.map(menu =>
      tx.menuItem.upsert({
        where: { id: menu.id },
        update: {
          parentId: menu.parentId,
          title: menu.title,
          url: menu.url,
          index: menu.index,
          level: menu.level,
          sortId: menu.sortId,
          permissionCode: menu.permissionCode,
          auth: false,
          toolMenu: false,
        },
        create: {
          id: menu.id,
          parentId: menu.parentId,
          title: menu.title,
          icon: null,
          url: menu.url,
          code: null,
          index: menu.index,
          level: menu.level,
          sortId: menu.sortId,
          permissionCode: menu.permissionCode,
          auth: false,
          toolMenu: false,
        },
      })
    )
  );

  await tx.menuItem.updateMany({
    where: { url: '/staff/sub-account' },
    data: { permissionCode: PERMISSIONS.ACCOUNT_MANAGE },
  });
}

/** Alias kept for the seed index and later tasks that refer to the auth seed by name. */
export const seedAuth = seedMerchantAuth;
