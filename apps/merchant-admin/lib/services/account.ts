import { prisma } from '@/lib/db';
import { SEED_MERCHANT_ID } from '@/lib/db/seed/ids';
import type { MerchantAccount } from '@/lib/generated/prisma';

import { AppError } from '../errors';

export interface AccountDTO {
  id: string;
  login: string;
  mobile: string;
  interCode: string;
  merchantId: string;
}

export interface UpsertAccountInput {
  interCode: string;
  mobile: string;
}

function toAccountDTO(account: MerchantAccount): AccountDTO {
  return {
    id: account.id,
    login: account.username,
    mobile: account.phone ?? '',
    interCode: account.interCode,
    merchantId: account.merchantId,
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
