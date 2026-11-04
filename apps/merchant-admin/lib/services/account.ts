import { prisma } from '@/lib/db';
import { SEED_MERCHANT_ID } from '@/lib/db/seed/ids';
import type { MerchantAccount, MerchantLoginLog } from '@/lib/generated/prisma';

import { AppError } from '../errors';

export interface AccountDTO {
  id: string;
  login: string;
  name: string;
  mobile: string;
  interCode: string;
  merchantId: string;
  isOwner: boolean;
}

export interface UpsertAccountInput {
  interCode: string;
  mobile: string;
}

function toAccountDTO(account: MerchantAccount): AccountDTO {
  return {
    id: account.id,
    login: account.username,
    name: account.name,
    mobile: account.phone ?? '',
    interCode: account.interCode,
    merchantId: account.merchantId,
    isOwner: account.isOwner,
  };
}

export async function getAccount(accountId: string): Promise<AccountDTO> {
  const account = await prisma.merchantAccount.findUnique({ where: { id: accountId } });

  if (!account) {
    throw new AppError('NOT_FOUND', 404, '账号不存在');
  }

  return toAccountDTO(account);
}

export async function upsertAccount(input: UpsertAccountInput): Promise<AccountDTO> {
  const existing = await prisma.merchantAccount.findFirst({
    where: { interCode: input.interCode, phone: input.mobile },
  });

  const account =
    existing ??
    (await prisma.merchantAccount.create({
      data: {
        username: input.mobile,
        phone: input.mobile,
        interCode: input.interCode,
        merchantId: SEED_MERCHANT_ID,
        name: input.mobile,
        isOwner: false,
      },
    }));

  return toAccountDTO(account);
}

/** Looks up an account by login username or phone number (password login). */
export function findMerchantAccountByIdentifier(identifier: string): Promise<MerchantAccount | null> {
  return prisma.merchantAccount.findFirst({
    where: { OR: [{ username: identifier }, { phone: identifier }] },
  });
}

/** Looks up an account by phone (captcha login), without creating one. */
export function findMerchantAccountByPhone(interCode: string, mobile: string): Promise<MerchantAccount | null> {
  return prisma.merchantAccount.findFirst({ where: { interCode, phone: mobile } });
}

export function recordMerchantLogin(accountId: string, success: boolean): Promise<MerchantLoginLog> {
  return prisma.merchantLoginLog.create({ data: { accountId, ip: null, userAgent: null, success } });
}

export function markMerchantAccountLogin(accountId: string): Promise<MerchantAccount> {
  return prisma.merchantAccount.update({ where: { id: accountId }, data: { lastLoginAt: new Date() } });
}
