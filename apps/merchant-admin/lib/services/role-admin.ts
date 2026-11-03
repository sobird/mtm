import { isMerchantPermission } from '@mtm/contracts';

import { prisma } from '@/lib/db/client';
import { AppError } from '@/lib/errors';
import { Prisma } from '@/lib/generated/prisma';

import { writeOperationLog } from './operation-log';

export interface MerchantRoleDTO {
  id: string;
  code: string;
  name: string;
  permissions: string[];
  accountCount: number;
}

export interface CreateRoleInput {
  code: string;
  name: string;
  permissionCodes: string[];
}

export interface UpdateRoleInput {
  name?: string;
  permissionCodes?: string[];
}

export interface MerchantPermissionDTO {
  code: string;
  name: string;
  type: string;
  path: string | null;
  sort: number;
}

type RoleWithRelations = Prisma.MerchantRoleGetPayload<{
  include: {
    permissions: { include: { permission: true } };
    _count: { select: { accounts: true } };
  };
}>;

const roleInclude = {
  permissions: { include: { permission: true } },
  _count: { select: { accounts: true } },
} as const;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function toRoleDTO(role: RoleWithRelations): MerchantRoleDTO {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    permissions: role.permissions.map(item => item.permission.code).sort(),
    accountCount: role._count.accounts,
  };
}

function assertValidPermissions(codes: string[]): void {
  for (const code of codes) {
    if (!isMerchantPermission(code)) {
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
  const permissions = await client.merchantPermission.findMany({
    where: { code: { in: uniqueCodes } },
    select: { id: true, code: true },
  });

  if (permissions.length !== uniqueCodes.length) {
    throw new AppError('INVALID_PERMISSION', 400, '权限码不合法');
  }

  return permissions.map(permission => permission.id);
}

/** Only the merchant owner may administer roles. */
async function assertOwnerActor(
  client: Prisma.TransactionClient | typeof prisma,
  actorId: string,
  merchantId: string
): Promise<void> {
  const actor = await client.merchantAccount.findUnique({
    where: { id: actorId },
    select: { isOwner: true, merchantId: true },
  });

  if (!actor || !actor.isOwner || actor.merchantId !== merchantId) {
    throw new AppError('FORBIDDEN', 403, '无权访问');
  }
}

export async function listRoles(merchantId: string): Promise<MerchantRoleDTO[]> {
  const roles = await prisma.merchantRole.findMany({
    where: { merchantId },
    include: roleInclude,
    orderBy: { code: 'asc' },
  });

  return roles.map(role => toRoleDTO(role));
}

export async function createRole(
  merchantId: string,
  input: CreateRoleInput,
  actorId: string
): Promise<MerchantRoleDTO> {
  assertValidPermissions(input.permissionCodes);

  const permissionCodes = unique(input.permissionCodes);
  let roleId: string;

  try {
    roleId = await prisma.$transaction(async tx => {
      await assertOwnerActor(tx, actorId, merchantId);

      const existing = await tx.merchantRole.findUnique({
        where: { merchantId_code: { merchantId, code: input.code } },
      });

      if (existing) {
        throw new AppError('ROLE_CODE_TAKEN', 409, '角色编码已存在');
      }

      const permissionIds = await resolvePermissionCodes(tx, permissionCodes);
      const role = await tx.merchantRole.create({
        data: { merchantId, code: input.code, name: input.name },
        select: { id: true },
      });

      if (permissionIds.length > 0) {
        await tx.merchantRolePermission.createMany({
          data: permissionIds.map(permissionId => ({ roleId: role.id, permissionId })),
          skipDuplicates: true,
        });
      }

      await writeOperationLog(
        {
          accountId: actorId,
          action: 'create',
          resource: 'merchant-role',
          resourceId: role.id,
          detail: { code: input.code, name: input.name, permissionCodes },
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

  return getRoleOrThrow(merchantId, roleId);
}

export async function updateRole(
  merchantId: string,
  id: string,
  input: UpdateRoleInput,
  actorId: string
): Promise<MerchantRoleDTO> {
  if (input.permissionCodes !== undefined) {
    assertValidPermissions(input.permissionCodes);
  }

  const updated = await prisma.$transaction(async tx => {
    await assertOwnerActor(tx, actorId, merchantId);

    const existing = await tx.merchantRole.findFirst({ where: { id, merchantId }, select: { id: true } });

    if (!existing) {
      throw new AppError('ROLE_NOT_FOUND', 404, '角色不存在');
    }

    await tx.merchantRole.update({ where: { id }, data: { name: input.name } });

    if (input.permissionCodes !== undefined) {
      const permissionIds = await resolvePermissionCodes(tx, unique(input.permissionCodes));

      await tx.merchantRolePermission.deleteMany({ where: { roleId: id } });
      if (permissionIds.length > 0) {
        await tx.merchantRolePermission.createMany({
          data: permissionIds.map(permissionId => ({ roleId: id, permissionId })),
          skipDuplicates: true,
        });
      }
    }

    await writeOperationLog(
      {
        accountId: actorId,
        action: 'update',
        resource: 'merchant-role',
        resourceId: id,
        detail: {
          name: input.name ?? null,
          permissionCodes: input.permissionCodes ?? null,
        },
      },
      tx
    );

    return tx.merchantRole.findUniqueOrThrow({ where: { id }, include: roleInclude });
  });

  return toRoleDTO(updated);
}

export async function listPermissions(): Promise<MerchantPermissionDTO[]> {
  const permissions = await prisma.merchantPermission.findMany({ orderBy: [{ sort: 'asc' }, { code: 'asc' }] });

  return permissions.map(permission => ({
    code: permission.code,
    name: permission.name,
    type: permission.type,
    path: permission.path,
    sort: permission.sort,
  }));
}

async function getRoleOrThrow(merchantId: string, id: string): Promise<MerchantRoleDTO> {
  const role = await prisma.merchantRole.findFirstOrThrow({ where: { id, merchantId }, include: roleInclude });

  return toRoleDTO(role);
}
