import { prisma } from '@/lib/db';
import { Prisma, type Merchant } from '@/lib/generated/prisma';
import type { PaginationInput } from '@/lib/pagination';
import { normalizePagination } from '@/lib/pagination';

import { AppError } from '../errors';
import { getReferenceData } from './reference-data';

export interface MerchantDTO {
  id: number | string;
  name?: string;
  status?: number;
  type?: number;
  [key: string]: unknown;
}

export interface MerchantCategoryDTO {
  id: string;
  parentId: string;
  name: string;
  level: number;
}

export interface LicenseDTO {
  id: string;
  merchantId: string;
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
  dto.status = merchant.status ?? undefined;
  dto.type = merchant.type ?? undefined;

  return dto;
}

export async function getMerchant(merchantId: string): Promise<MerchantDTO> {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });

  if (!merchant) {
    throw new AppError('NOT_FOUND', 404, '商家不存在');
  }

  return toMerchantDTO(merchant);
}

export async function listMerchants(params: PaginationInput): Promise<{ total: number; list: MerchantDTO[] }> {
  const { ps, offset } = normalizePagination(params ?? {});
  const [rows, count] = await Promise.all([
    prisma.merchant.findMany({ take: ps, skip: offset, orderBy: { id: 'asc' } }),
    prisma.merchant.count(),
  ]);

  const list: MerchantDTO[] = [];
  for (const row of rows) {
    list.push(toMerchantDTO(row));
  }

  return { total: count, list };
}

export async function getCategories(parentId?: string): Promise<MerchantCategoryDTO[]> {
  const rows = await prisma.merchantCategory.findMany({
    where: parentId === undefined ? undefined : { parentId },
    orderBy: { id: 'asc' },
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

export async function listLicenses(merchantId: string): Promise<LicenseDTO[]> {
  const rows = await prisma.merchantLicense.findMany({
    where: { merchantId },
    orderBy: { id: 'asc' },
  });

  const list: LicenseDTO[] = [];
  for (const row of rows) {
    list.push({
      id: row.id,
      merchantId: row.merchantId,
      type: row.type ?? 0,
      name: row.name ?? '',
      url: row.url ?? '',
      status: row.status ?? 0,
      expireAt: row.expireAt ?? '',
    });
  }

  return list;
}

export async function signContract(merchantId: string, input: SignContractInput): Promise<void> {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });

  if (!merchant) {
    throw new AppError('NOT_FOUND', 404, '商家不存在');
  }

  const payload = asRecord(merchant.payload);
  const contract = asRecord(payload.contract);
  payload.contract = { ...contract, name: input.name, idCard: input.idCard };

  await prisma.merchant.update({
    where: { id: merchantId },
    data: { payload: payload as Prisma.InputJsonValue },
  });
}
