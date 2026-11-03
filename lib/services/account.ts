import { Account } from '@/lib/db/models';

import { AppError } from '../errors';

export interface AccountDTO {
  id: number;
  login: string;
  mobile: string;
  interCode: string;
  merchantId: number;
}

export interface UpsertAccountInput {
  interCode: string;
  mobile: string;
}

function toAccountDTO(account: Account): AccountDTO {
  return {
    id: account.id,
    login: account.login,
    mobile: account.mobile,
    interCode: account.interCode,
    merchantId: account.merchantId,
  };
}

export async function getAccount(accountId: number): Promise<AccountDTO> {
  const account = await Account.findByPk(accountId);

  if (!account) {
    throw new AppError('NOT_FOUND', 404, '账号不存在');
  }

  return toAccountDTO(account);
}

export async function upsertAccount(input: UpsertAccountInput): Promise<AccountDTO> {
  const [account] = await Account.findOrCreate({
    where: { interCode: input.interCode, mobile: input.mobile },
    defaults: {
      login: input.mobile,
      mobile: input.mobile,
      interCode: input.interCode,
      merchantId: 1,
    },
  });

  return toAccountDTO(account);
}
