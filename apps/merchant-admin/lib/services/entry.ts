import { EntryTask, EntryType, MerchantEntry } from '@/lib/db/models';

import { AppError } from '../errors';

export interface EntryDTO {
  merchantId: number;
  step: number;
  status: number;
  [key: string]: unknown;
}

export interface EntryTaskDTO {
  id: number;
  entryTaskId: number;
  merchantId: number;
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

  return { ...payload, merchantId: entry.merchantId, step: entry.step, status: entry.status };
}

export async function getEntry(merchantId: number, entryTaskId?: number): Promise<EntryDTO> {
  const entry = await MerchantEntry.findByPk(merchantId);

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

export async function updateEntry(merchantId: number, input: Partial<EntryDTO>): Promise<EntryDTO> {
  const entry = await MerchantEntry.findByPk(merchantId);

  if (!entry) {
    throw new AppError('NOT_FOUND', 404, '入驻信息不存在');
  }

  entry.payload = { ...asRecord(entry.payload), ...input };
  if (typeof input.step === 'number') {
    entry.step = input.step;
  }
  if (typeof input.status === 'number') {
    entry.status = input.status;
  }

  entry.changed('payload', true);
  await entry.save();

  return toEntryDTO(entry);
}

export async function getEntryTask(merchantId: number): Promise<EntryTaskDTO> {
  const task = await EntryTask.findOne({ where: { merchantId } });

  if (!task) {
    throw new AppError('NOT_FOUND', 404, '入驻任务不存在');
  }

  return {
    id: task.id,
    entryTaskId: task.id,
    merchantId: task.merchantId,
    bizType: task.bizType,
    localCommerce: task.localCommerce,
    status: task.status,
  };
}

export async function getEntryTypes(): Promise<EntryTypeDTO[]> {
  const rows = await EntryType.findAll({ order: [['code', 'ASC']] });

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
  const row = await EntryType.findOne({ where: { code: type } });

  if (!row) {
    throw new AppError('NOT_FOUND', 404, '入驻类型不存在');
  }

  return { url: row.templateUrl ?? '' };
}
