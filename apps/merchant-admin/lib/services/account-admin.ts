import { hashPassword } from '@mtm/auth/password';

import { prisma } from '@/lib/db/client';
import { AppError } from '@/lib/errors';
import { Prisma } from '@/lib/generated/prisma';

import { writeOperationLog } from './operation-log';

export type MerchantAccountStatus = 'ACTIVE' | 'DISABLED';

export interface MerchantAccountRoleDTO {
  id: string;
  code: string;
  name: string;
}

export interface MerchantAccountDTO {
  id: string;
  username: string;
  name: string;
  phone: string | null;
  interCode: string;
  isOwner: boolean;
  status: MerchantAccountStatus;
  roles: MerchantAccountRoleDTO[];
  lastLoginAt: string | null;
  createdAt: string;
}

export interface ListAccountsQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: MerchantAccountStatus;
}

export interface CreateAccountInput {
  username: string;
  name: string;
  password: string;
  roleIds: string[];
}

export interface UpdateAccountInput {
  name?: string;
  status?: MerchantAccountStatus;
  roleIds?: string[];
}

const accountInclude = {
  roles: { include: { role: true } },
} as const;

type AccountWithRoles = Prisma.MerchantAccountGetPayload<{ include: typeof accountInclude }>;

function toAccountDTO(account: AccountWithRoles): MerchantAccountDTO {
  const roles = account.roles
    .map(item => ({ id: item.role.id, code: item.role.code, name: item.role.name }))
    .sort((a, b) => a.code.localeCompare(b.code));

  return {
    id: account.id,
    username: account.username,
    name: account.name,
    phone: account.phone,
    interCode: account.interCode,
    isOwner: account.isOwner,
    status: account.status,
    roles,
    lastLoginAt: account.lastLoginAt?.toISOString() ?? null,
    createdAt: account.createdAt.toISOString(),
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

/**
 * Only the merchant owner may administer accounts. `merchantId` always comes
 * from the authenticated route context, so an owner cannot act on another
 * merchant by supplying a different id.
 */
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

/** Ensures the target is a non-owner sub-account of the current merchant. */
async function assertSubAccountTarget(
  client: Prisma.TransactionClient | typeof prisma,
  merchantId: string,
  id: string
): Promise<void> {
  const target = await client.merchantAccount.findUnique({
    where: { id },
    select: { isOwner: true, merchantId: true },
  });

  if (!target || target.merchantId !== merchantId) {
    throw new AppError('ACCOUNT_NOT_FOUND', 404, '账号不存在');
  }

  if (target.isOwner) {
    throw new AppError('OWNER_IMMUTABLE', 403, '主账号不可修改');
  }
}

async function assertRolesExist(
  client: Prisma.TransactionClient | typeof prisma,
  merchantId: string,
  roleIds: string[]
): Promise<void> {
  const ids = unique(roleIds);

  if (ids.length === 0) {
    return;
  }

  const count = await client.merchantRole.count({ where: { id: { in: ids }, merchantId } });

  if (count !== ids.length) {
    throw new AppError('INVALID_ROLE', 400, '角色不存在');
  }
}

export async function listAccounts(
  merchantId: string,
  query: ListAccountsQuery
): Promise<{ items: MerchantAccountDTO[]; total: number }> {
  const where: Prisma.MerchantAccountWhereInput = { merchantId };

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
    prisma.merchantAccount.findMany({
      where,
      include: accountInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.merchantAccount.count({ where }),
  ]);

  return { items: rows.map(row => toAccountDTO(row)), total };
}

export async function createAccount(
  actorId: string,
  merchantId: string,
  input: CreateAccountInput
): Promise<MerchantAccountDTO> {
  await assertOwnerActor(prisma, actorId, merchantId);

  const existing = await prisma.merchantAccount.findUnique({ where: { username: input.username } });

  if (existing) {
    throw new AppError('USERNAME_TAKEN', 409, '用户名已存在');
  }

  const roleIds = unique(input.roleIds);
  const passwordHash = await hashPassword(input.password);
  let accountId: string;

  try {
    accountId = await prisma.$transaction(async tx => {
      await assertRolesExist(tx, merchantId, roleIds);

      const account = await tx.merchantAccount.create({
        data: {
          merchantId,
          username: input.username,
          name: input.name,
          passwordHash,
          isOwner: false,
          roles: { create: roleIds.map(roleId => ({ roleId })) },
        },
        select: { id: true },
      });

      await writeOperationLog(
        {
          accountId: actorId,
          action: 'create',
          resource: 'merchant-account',
          resourceId: account.id,
          detail: { username: input.username, name: input.name, roleIds },
        },
        tx
      );

      return account.id;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError('USERNAME_TAKEN', 409, '用户名已存在');
    }

    throw error;
  }

  return getAccountOrThrow(accountId);
}

export async function updateAccount(
  actorId: string,
  merchantId: string,
  id: string,
  input: UpdateAccountInput
): Promise<MerchantAccountDTO> {
  const updated = await prisma.$transaction(async tx => {
    await assertOwnerActor(tx, actorId, merchantId);
    await assertSubAccountTarget(tx, merchantId, id);

    if (input.roleIds !== undefined) {
      await assertRolesExist(tx, merchantId, input.roleIds);
    }

    await tx.merchantAccount.update({
      where: { id },
      data: { name: input.name, status: input.status },
    });

    if (input.roleIds !== undefined) {
      const roleIds = unique(input.roleIds);

      await tx.merchantAccountRole.deleteMany({ where: { accountId: id } });
      if (roleIds.length > 0) {
        await tx.merchantAccountRole.createMany({
          data: roleIds.map(roleId => ({ accountId: id, roleId })),
          skipDuplicates: true,
        });
      }
    }

    await writeOperationLog(
      {
        accountId: actorId,
        action: 'update',
        resource: 'merchant-account',
        resourceId: id,
        detail: {
          name: input.name ?? null,
          status: input.status ?? null,
          roleIds: input.roleIds ?? null,
        },
      },
      tx
    );

    return tx.merchantAccount.findUniqueOrThrow({ where: { id }, include: accountInclude });
  });

  return toAccountDTO(updated);
}

export async function resetAccountPassword(
  actorId: string,
  merchantId: string,
  id: string,
  password: string
): Promise<void> {
  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async tx => {
    await assertOwnerActor(tx, actorId, merchantId);
    await assertSubAccountTarget(tx, merchantId, id);

    const account = await tx.merchantAccount.findUniqueOrThrow({
      where: { id },
      select: { username: true },
    });

    await tx.merchantAccount.update({ where: { id }, data: { passwordHash } });

    // Never include the plaintext password in the audit log.
    await writeOperationLog(
      {
        accountId: actorId,
        action: 'reset-password',
        resource: 'merchant-account',
        resourceId: id,
        detail: { username: account.username },
      },
      tx
    );
  });
}

async function getAccountOrThrow(id: string): Promise<MerchantAccountDTO> {
  const account = await prisma.merchantAccount.findUniqueOrThrow({ where: { id }, include: accountInclude });

  return toAccountDTO(account);
}
