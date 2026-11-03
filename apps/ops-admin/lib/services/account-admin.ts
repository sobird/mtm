import { hashPassword } from '@mtm/auth/password';

import { prisma } from '@/lib/db/client';
import { AppError } from '@/lib/errors';
import { Prisma } from '@/lib/generated/prisma';

import { writeOperationLog } from './operation-log';

export type OpsAccountStatus = 'ACTIVE' | 'DISABLED';

export interface OpsAccountRoleDTO {
  id: string;
  code: string;
  name: string;
}

export interface OpsAccountDTO {
  id: string;
  username: string;
  name: string;
  status: OpsAccountStatus;
  roles: OpsAccountRoleDTO[];
  lastLoginAt: string | null;
  createdAt: string;
}

export interface ListAccountsQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: OpsAccountStatus;
}

export interface CreateAccountInput {
  username: string;
  name: string;
  password: string;
  roleIds: string[];
}

export interface UpdateAccountInput {
  name?: string;
  status?: OpsAccountStatus;
  roleIds?: string[];
}

const SUPER_ADMIN_CODE = 'super-admin';

const accountInclude = {
  roles: { include: { role: true } },
} as const;

type AccountWithRoles = Prisma.OpsAccountGetPayload<{ include: typeof accountInclude }>;

function toAccountDTO(account: AccountWithRoles): OpsAccountDTO {
  const roles = account.roles
    .map(item => ({ id: item.role.id, code: item.role.code, name: item.role.name }))
    .sort((a, b) => a.code.localeCompare(b.code));

  return {
    id: account.id,
    username: account.username,
    name: account.name,
    status: account.status,
    roles,
    lastLoginAt: account.lastLoginAt?.toISOString() ?? null,
    createdAt: account.createdAt.toISOString(),
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

async function assertRolesExist(client: Prisma.TransactionClient | typeof prisma, roleIds: string[]): Promise<void> {
  const ids = unique(roleIds);

  if (ids.length === 0) {
    return;
  }

  const count = await client.opsRole.count({ where: { id: { in: ids } } });

  if (count !== ids.length) {
    throw new AppError('INVALID_ROLE', 400, '角色不存在');
  }
}

export async function listAccounts(query: ListAccountsQuery): Promise<{ items: OpsAccountDTO[]; total: number }> {
  const where: Prisma.OpsAccountWhereInput = {};

  if (query.keyword) {
    where.OR = [
      { username: { contains: query.keyword, mode: 'insensitive' } },
      { name: { contains: query.keyword, mode: 'insensitive' } },
    ];
  }

  if (query.status) {
    where.status = query.status;
  }

  const [rows, total] = await Promise.all([
    prisma.opsAccount.findMany({
      where,
      include: accountInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.opsAccount.count({ where }),
  ]);

  return { items: rows.map(row => toAccountDTO(row)), total };
}

export async function createAccount(actorId: string, input: CreateAccountInput): Promise<OpsAccountDTO> {
  const existing = await prisma.opsAccount.findUnique({ where: { username: input.username } });

  if (existing) {
    throw new AppError('USERNAME_TAKEN', 409, '用户名已存在');
  }

  const roleIds = unique(input.roleIds);
  await assertRolesExist(prisma, roleIds);

  const passwordHash = await hashPassword(input.password);
  let accountId: string;

  try {
    const account = await prisma.opsAccount.create({
      data: {
        username: input.username,
        name: input.name,
        passwordHash,
        roles: { create: roleIds.map(roleId => ({ roleId })) },
      },
      select: { id: true },
    });
    accountId = account.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError('USERNAME_TAKEN', 409, '用户名已存在');
    }

    throw error;
  }

  await writeOperationLog({
    accountId: actorId,
    action: 'create',
    resource: 'ops-account',
    resourceId: accountId,
    detail: { username: input.username, name: input.name, roleIds },
  });

  return getAccountOrThrow(accountId);
}

export async function updateAccount(actorId: string, id: string, input: UpdateAccountInput): Promise<OpsAccountDTO> {
  if (id === actorId && input.status === 'DISABLED') {
    throw new AppError('SELF_DISABLE_FORBIDDEN', 403, '不能停用当前账号');
  }

  const updated = await prisma.$transaction(async tx => {
    const target = await tx.opsAccount.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });

    if (!target) {
      throw new AppError('ACCOUNT_NOT_FOUND', 404, '账号不存在');
    }

    if (input.roleIds !== undefined) {
      await assertRolesExist(tx, input.roleIds);
    }

    const superRole = await tx.opsRole.findUnique({ where: { code: SUPER_ADMIN_CODE }, select: { id: true } });
    const superRoleId = superRole?.id;
    const hadSuperAdmin = Boolean(superRoleId) && target.roles.some(item => item.roleId === superRoleId);
    const removesSuperAdmin =
      Boolean(superRoleId) &&
      input.roleIds !== undefined &&
      hadSuperAdmin &&
      !unique(input.roleIds).includes(superRoleId as string);
    const disablesAccount = input.status === 'DISABLED' && target.status === 'ACTIVE';

    if (hadSuperAdmin && (removesSuperAdmin || disablesAccount)) {
      const otherSuperAdmins = await tx.opsAccount.count({
        where: {
          id: { not: id },
          status: 'ACTIVE',
          roles: { some: { role: { code: SUPER_ADMIN_CODE } } },
        },
      });

      if (otherSuperAdmins === 0) {
        throw new AppError('LAST_SUPER_ADMIN', 409, '至少保留一个启用的超级管理员');
      }
    }

    await tx.opsAccount.update({
      where: { id },
      data: { name: input.name, status: input.status },
    });

    if (input.roleIds !== undefined) {
      const roleIds = unique(input.roleIds);

      await tx.opsAccountRole.deleteMany({ where: { accountId: id } });
      if (roleIds.length > 0) {
        await tx.opsAccountRole.createMany({
          data: roleIds.map(roleId => ({ accountId: id, roleId })),
          skipDuplicates: true,
        });
      }
    }

    return tx.opsAccount.findUniqueOrThrow({ where: { id }, include: accountInclude });
  });

  await writeOperationLog({
    accountId: actorId,
    action: 'update',
    resource: 'ops-account',
    resourceId: id,
    detail: {
      name: input.name ?? null,
      status: input.status ?? null,
      roleIds: input.roleIds ?? null,
    },
  });

  return toAccountDTO(updated);
}

export async function resetAccountPassword(actorId: string, id: string, password: string): Promise<void> {
  const account = await prisma.opsAccount.findUnique({ where: { id }, select: { id: true, username: true } });

  if (!account) {
    throw new AppError('ACCOUNT_NOT_FOUND', 404, '账号不存在');
  }

  const passwordHash = await hashPassword(password);

  await prisma.opsAccount.update({ where: { id }, data: { passwordHash } });

  // Never include the plaintext password in the audit log.
  await writeOperationLog({
    accountId: actorId,
    action: 'reset-password',
    resource: 'ops-account',
    resourceId: id,
    detail: { username: account.username },
  });
}

async function getAccountOrThrow(id: string): Promise<OpsAccountDTO> {
  const account = await prisma.opsAccount.findUniqueOrThrow({ where: { id }, include: accountInclude });

  return toAccountDTO(account);
}
