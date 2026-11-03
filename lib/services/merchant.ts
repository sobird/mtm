import { Merchant, MerchantCategory, MerchantLicense } from '@/lib/db/models';
import type { PaginationInput } from '@/lib/pagination';
import { normalizePagination } from '@/lib/pagination';

import { AppError } from '../errors';
import { getReferenceData } from './reference-data';

export interface MerchantDTO {
  id: number;
  name?: string;
  status?: number;
  type?: number;
  [key: string]: unknown;
}

export interface MerchantCategoryDTO {
  id: number;
  parentId: number;
  name: string;
  level: number;
}

export interface LicenseDTO {
  id: number;
  merchantId: number;
  type: number;
  name: string;
  url: string;
  status: number;
  expireAt: string;
}

export interface SignContractInput {
  name: string;
  idCard: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function toMerchantDTO(merchant: Merchant): MerchantDTO {
  const payload = asRecord(merchant.payload);
  const dto: MerchantDTO = { ...payload, id: merchant.id };

  dto.id = typeof payload.id === 'number' ? payload.id : merchant.id;
  dto.name = merchant.name ?? (payload.name as string) ?? '';
  dto.status = merchant.status;
  dto.type = merchant.type;

  return dto;
}

export async function getMerchant(merchantId: number): Promise<MerchantDTO> {
  const merchant = await Merchant.findByPk(merchantId);

  if (!merchant) {
    throw new AppError('NOT_FOUND', 404, '商家不存在');
  }

  return toMerchantDTO(merchant);
}

export async function listMerchants(params: PaginationInput): Promise<{ total: number; list: MerchantDTO[] }> {
  const { ps, offset } = normalizePagination(params ?? {});
  const { rows, count } = await Merchant.findAndCountAll({
    limit: ps,
    offset,
    order: [['id', 'ASC']],
  });

  const list: MerchantDTO[] = [];
  for (const row of rows) {
    list.push(toMerchantDTO(row));
  }

  return { total: Array.isArray(count) ? count.length : count, list };
}

export async function getCategories(parentId?: number): Promise<MerchantCategoryDTO[]> {
  const rows = await MerchantCategory.findAll({
    where: parentId === undefined ? undefined : { parentId },
    order: [['id', 'ASC']],
  });

  const list: MerchantCategoryDTO[] = [];
  for (const row of rows) {
    list.push({
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      level: row.level,
    });
  }

  return list;
}

export async function getMerchantOptions(): Promise<Record<string, unknown>> {
  return getReferenceData<Record<string, unknown>>('merchant-options');
}

export async function listLicenses(merchantId: number): Promise<LicenseDTO[]> {
  const rows = await MerchantLicense.findAll({
    where: { merchantId },
    order: [['id', 'ASC']],
  });

  const list: LicenseDTO[] = [];
  for (const row of rows) {
    list.push({
      id: row.id,
      merchantId: row.merchantId,
      type: row.type,
      name: row.name,
      url: row.url,
      status: row.status,
      expireAt: row.expireAt,
    });
  }

  return list;
}

export async function signContract(merchantId: number, input: SignContractInput): Promise<void> {
  const merchant = await Merchant.findByPk(merchantId);

  if (!merchant) {
    throw new AppError('NOT_FOUND', 404, '商家不存在');
  }

  const payload = asRecord(merchant.payload);
  const contract = asRecord(payload.contract);
  payload.contract = { ...contract, name: input.name, idCard: input.idCard };

  merchant.payload = payload;
  merchant.changed('payload', true);
  await merchant.save();
}
