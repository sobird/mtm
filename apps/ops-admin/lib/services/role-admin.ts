import { isOpsPermission, PERMISSIONS } from '@mtm/contracts';

import { prisma } from '@/lib/db/client';
import { AppError } from '@/lib/errors';
import { Prisma } from '@/lib/generated/prisma';

import { writeOperationLog } from './operation-log';

export interface OpsRoleDTO {
  id: string;
  code: string;
  name: string;
  permissions: string[];
  merchantScope: string[];
  accountCount: number;
}

export interface CreateRoleInput {
  code: string;
  name: string;
  permissionCodes: string[];
  merchantScope: string[];
}

export interface UpdateRoleInput {
  name?: string;
  permissionCodes?: string[];
  merchantScope?: string[];
}

export interface OpsPermissionDTO {
  code: string;
  name: string;
  type: string;
  path: string | null;
  sort: number;
}

type RoleWithRelations = Prisma.OpsRoleGetPayload<{
  include: {
    permissions: { include: { permission: true } };
    merchantScopes: true;
    _count: { select: { accounts: true } };
  };
}>;

const roleInclude = {
  permissions: { include: { permission: true } },
  merchantScopes: true,
  _count: { select: { accounts: true } },
} as const;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function toRoleDTO(role: RoleWithRelations): OpsRoleDTO {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    permissions: role.permissions.map(item => item.permission.code).sort(),
    merchantScope: unique(role.merchantScopes.map(item => item.merchantId)).sort(),
    accountCount: role._count.accounts,
  };
}

function assertValidPermissions(codes: string[]): void {
  for (const code of codes) {
    if (!isOpsPermission(code)) {
      throw new AppError('INVALID_PERMISSION', 400, '权限码不合法');
    }
  }
}

/** Ensures every permission code exists in the current database. */
async function resolvePermissionCodes(
  client: Prisma.TransactionClient | typeof prisma,
  codes: string[]
): Promise<string[]> {
  const uniqueCodes = unique(codes);
  const permissions = await client.opsPermission.findMany({
    where: { code: { in: uniqueCodes } },
    select: { id: true, code: true },
  });

  if (permissions.length !== uniqueCodes.length) {
    throw new AppError('INVALID_PERMISSION', 400, '权限码不合法');
  }

  return permissions.map(permission => permission.id);
}

export async function listRoles(): Promise<OpsRoleDTO[]> {
  const roles = await prisma.opsRole.findMany({ include: roleInclude, orderBy: { code: 'asc' } });

  return roles.map(role => toRoleDTO(role));
}

export async function createRole(actorId: string, input: CreateRoleInput): Promise<OpsRoleDTO> {
  assertValidPermissions(input.permissionCodes);

  const permissionCodes = unique(input.permissionCodes);
  const isCrossTenant = permissionCodes.includes(PERMISSIONS.PLATFORM_CROSS_TENANT);
  const merchantScope = isCrossTenant ? [] : unique(input.merchantScope);

  const existing = await prisma.opsRole.findUnique({ where: { code: input.code } });

  if (existing) {
    throw new AppError('ROLE_CODE_TAKEN', 409, '角色编码已存在');
  }

  let roleId: string;

  try {
    roleId = await prisma.$transaction(async tx => {
      const permissionIds = await resolvePermissionCodes(tx, permissionCodes);
      const role = await tx.opsRole.create({
        data: { code: input.code, name: input.name },
        select: { id: true },
      });

      if (permissionIds.length > 0) {
        await tx.opsRolePermission.createMany({
          data: permissionIds.map(permissionId => ({ roleId: role.id, permissionId })),
          skipDuplicates: true,
        });
      }

      if (merchantScope.length > 0) {
        await tx.opsRoleMerchantScope.createMany({
          data: merchantScope.map(merchantId => ({ roleId: role.id, merchantId })),
          skipDuplicates: true,
        });
      }

      await writeOperationLog(
        {
          accountId: actorId,
          action: 'create',
          resource: 'ops-role',
          resourceId: role.id,
          detail: { code: input.code, name: input.name },
        },
        tx
      );

      return role.id;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError('ROLE_CODE_TAKEN', 409, '角色编码已存在');
    }

    throw error;
  }

  return getRoleOrThrow(roleId);
}

export async function updateRole(actorId: string, id: string, input: UpdateRoleInput): Promise<OpsRoleDTO> {
  if (input.permissionCodes !== undefined) {
    assertValidPermissions(input.permissionCodes);
  }

  const updated = await prisma.$transaction(async tx => {
    const existing = await tx.opsRole.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });

    if (!existing) {
      throw new AppError('ROLE_NOT_FOUND', 404, '角色不存在');
    }

    const effectiveCodes =
      input.permissionCodes === undefined
        ? existing.permissions.map(item => item.permission.code)
        : unique(input.permissionCodes);
    const isCrossTenant = effectiveCodes.includes(PERMISSIONS.PLATFORM_CROSS_TENANT);

    await tx.opsRole.update({ where: { id }, data: { name: input.name } });

    if (input.permissionCodes !== undefined) {
      const permissionIds = await resolvePermissionCodes(tx, effectiveCodes);

      await tx.opsRolePermission.deleteMany({ where: { roleId: id } });
      if (permissionIds.length > 0) {
        await tx.opsRolePermission.createMany({
          data: permissionIds.map(permissionId => ({ roleId: id, permissionId })),
          skipDuplicates: true,
        });
      }
    }

    if (isCrossTenant) {
      await tx.opsRoleMerchantScope.deleteMany({ where: { roleId: id } });
    } else if (input.merchantScope !== undefined) {
      const merchantScope = unique(input.merchantScope);

      await tx.opsRoleMerchantScope.deleteMany({ where: { roleId: id } });
      if (merchantScope.length > 0) {
        await tx.opsRoleMerchantScope.createMany({
          data: merchantScope.map(merchantId => ({ roleId: id, merchantId })),
          skipDuplicates: true,
        });
      }
    }

    await writeOperationLog(
      {
        accountId: actorId,
        action: 'update',
        resource: 'ops-role',
        resourceId: id,
        detail: {
          name: input.name ?? null,
          permissionCodes: input.permissionCodes ?? null,
          merchantScope: input.merchantScope ?? null,
        },
      },
      tx
    );

    return tx.opsRole.findUniqueOrThrow({ where: { id }, include: roleInclude });
  });

  return toRoleDTO(updated);
}

export async function listPermissions(): Promise<OpsPermissionDTO[]> {
  const permissions = await prisma.opsPermission.findMany({ orderBy: [{ sort: 'asc' }, { code: 'asc' }] });

  return permissions.map(permission => ({
    code: permission.code,
    name: permission.name,
    type: permission.type,
    path: permission.path,
    sort: permission.sort,
  }));
}

async function getRoleOrThrow(id: string): Promise<OpsRoleDTO> {
  const role = await prisma.opsRole.findUniqueOrThrow({ where: { id }, include: roleInclude });

  return toRoleDTO(role);
}
