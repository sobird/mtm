import { Campaign } from '@/lib/db/models';
import type { PaginationInput } from '@/lib/pagination';
import { normalizePagination } from '@/lib/pagination';

export interface CampaignListQuery extends PaginationInput {
  type?: number | string;
  applyStatus?: number;
  /** Maximum number of rows returned, mirroring the legacy client behaviour. */
  max?: number;
}

export interface CampaignDTO {
  id: string;
  name: string;
  type: number;
  startTime: string;
  endTime: string;
  applyStartTime: string;
  applyEndTime: string;
  startTimeStr: string;
  endTimeStr: string;
  applyStartTimeStr: string;
  applyEndTimeStr: string;
  applyStatus: number;
  applySpuCount: number | null;
  applySkuCount: number | null;
  minStock: string | null;
  maxStock: string | null;
  intro: string | null;
  cover: string | null;
  sug: string | null;
  faq: string | null;
  canFillApplyPrice: boolean | null;
  canFillActStock: boolean | null;
  canClickApply: boolean | null;
  cannotClickApplyReason: string | null;
  extField: unknown;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function strOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return String(value);
}

function boolOrNull(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function toCampaignDTO(row: Campaign): CampaignDTO {
  const payload = asRecord(row.payload);

  return {
    id: row.id,
    name: row.name ?? '',
    type: row.type ?? 0,
    startTime: row.startTime ?? '',
    endTime: row.endTime ?? '',
    applyStartTime: row.applyStartTime ?? '',
    applyEndTime: row.applyEndTime ?? '',
    startTimeStr: row.startTimeStr ?? '',
    endTimeStr: row.endTimeStr ?? '',
    applyStartTimeStr: row.applyStartTimeStr ?? '',
    applyEndTimeStr: row.applyEndTimeStr ?? '',
    applyStatus: row.applyStatus ?? 0,
    applySpuCount: row.applySpuCount ?? null,
    applySkuCount: row.applySkuCount ?? null,
    minStock: row.minStock ?? null,
    maxStock: row.maxStock ?? null,
    intro: strOrNull(payload.intro),
    cover: row.cover ?? strOrNull(payload.cover),
    sug: strOrNull(payload.sug),
    faq: strOrNull(payload.faq),
    canFillApplyPrice: boolOrNull(payload.canFillApplyPrice),
    canFillActStock: boolOrNull(payload.canFillActStock),
    canClickApply: row.canClickApply ?? boolOrNull(payload.canClickApply),
    cannotClickApplyReason: strOrNull(payload.cannotClickApplyReason),
    extField: payload.extField ?? null,
  };
}

export async function listCampaigns(query: CampaignListQuery = {}): Promise<{ total: number; list: CampaignDTO[] }> {
  const { ps, offset } = normalizePagination(query);
  const { rows, count } = await Campaign.findAndCountAll({
    limit: ps,
    offset,
    order: [['id', 'DESC']],
  });

  const list: CampaignDTO[] = [];
  for (const row of rows) {
    list.push(toCampaignDTO(row));
  }

  const limited = typeof query.max === 'number' && query.max >= 0 ? list.slice(0, query.max) : list;

  return { total: Array.isArray(count) ? count.length : count, list: limited };
}
