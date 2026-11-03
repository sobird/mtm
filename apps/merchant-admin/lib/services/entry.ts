import { prisma } from '@/lib/db';
import { Prisma, type MerchantEntry } from '@/lib/generated/prisma';

import { AppError } from '../errors';

export interface EntryDTO {
  merchantId: string;
  step: number;
  status: number;
  [key: string]: unknown;
}

export interface EntryTaskDTO {
  id: string;
  entryTaskId: string;
  merchantId: string;
  bizType: number;
  localCommerce: number;
  status: number;
}

export interface EntryTypeDTO {
  code: string;
  name: string;
  templateUrl: string | null;
  [key: string]: unknown;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function toEntryDTO(entry: MerchantEntry): EntryDTO {
  const payload = asRecord(entry.payload);
  const dto: EntryDTO = {
    ...payload,
    merchantId: entry.merchantId,
    step: entry.step ?? 0,
    status: entry.status ?? 0,
  };

  // Legacy payloads store entryTaskId as a number; project ids as strings so
  // the DTO matches the string-id contract used everywhere else.
  if (payload.entryTaskId !== undefined && payload.entryTaskId !== null) {
    dto.entryTaskId = String(payload.entryTaskId);
  }

  return dto;
}

export async function getEntry(merchantId: string, entryTaskId?: number): Promise<EntryDTO> {
  const entry = await prisma.merchantEntry.findUnique({ where: { merchantId } });

  if (!entry) {
    throw new AppError('NOT_FOUND', 404, '入驻信息不存在');
  }

  const payload = asRecord(entry.payload);
  if (entryTaskId !== undefined && payload.entryTaskId !== undefined) {
    if (Number(payload.entryTaskId) !== entryTaskId) {
      throw new AppError('NOT_FOUND', 404, '入驻任务不存在');
    }
  }

  return toEntryDTO(entry);
}

export async function updateEntry(merchantId: string, input: Partial<EntryDTO>): Promise<EntryDTO> {
  const entry = await prisma.merchantEntry.findUnique({ where: { merchantId } });

  if (!entry) {
    throw new AppError('NOT_FOUND', 404, '入驻信息不存在');
  }

  const data: Prisma.MerchantEntryUpdateInput = {
    payload: { ...asRecord(entry.payload), ...input } as Prisma.InputJsonValue,
  };
  if (typeof input.step === 'number') {
    data.step = input.step;
  }
  if (typeof input.status === 'number') {
    data.status = input.status;
  }

  const updated = await prisma.merchantEntry.update({ where: { merchantId }, data });

  return toEntryDTO(updated);
}

export async function getEntryTask(merchantId: string): Promise<EntryTaskDTO> {
  const task = await prisma.entryTask.findFirst({ where: { merchantId } });

  if (!task) {
    throw new AppError('NOT_FOUND', 404, '入驻任务不存在');
  }

  return {
    id: task.id,
    entryTaskId: task.id,
    merchantId: task.merchantId,
    bizType: task.bizType ?? 0,
    localCommerce: task.localCommerce ?? 0,
    status: task.status ?? 0,
  };
}

export async function getEntryTypes(): Promise<EntryTypeDTO[]> {
  const rows = await prisma.entryType.findMany({ orderBy: { code: 'asc' } });

  const list: EntryTypeDTO[] = [];
  for (const row of rows) {
    list.push({
      ...asRecord(row.payload),
      code: row.code,
      name: row.name,
      templateUrl: row.templateUrl,
    });
  }

  return list;
}

export async function getEntryTemplateUrl(type: string): Promise<{ url: string }> {
  const row = await prisma.entryType.findUnique({ where: { code: type } });

  if (!row) {
    throw new AppError('NOT_FOUND', 404, '入驻类型不存在');
  }

  return { url: row.templateUrl ?? '' };
}
