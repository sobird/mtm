import { prisma } from '@/lib/db';
import { Prisma, type Coupon } from '@/lib/generated/prisma';
import type { PaginationInput } from '@/lib/pagination';
import { normalizePagination } from '@/lib/pagination';

import { AppError } from '../errors';

export type CouponSortField = 'ctime' | 'sendCount' | 'leftCount';

export interface CouponListQuery extends PaginationInput {
  status?: number;
  stime?: number;
  etime?: number;
  target?: number;
  sort?: CouponSortField;
  order?: 'asc' | 'desc';
}

export interface CouponListItemDTO {
  id: string;
  name: string;
  type: number;
  target: number;
  stime: string | null;
  etime: string | null;
  price: number;
  discount: number;
  validDays: number;
  validStime: string | null;
  validEtime: string | null;
  sendCount: number;
  leftCount: number;
  status: number;
  useTerm: unknown;
  putTerm: [string | null, string | null];
  ctime: string | null;
}

export interface CouponDetailDTO extends CouponListItemDTO {
  displayName: string;
  rule: unknown;
  stock: number;
  limit: number;
  putCrowd: number;
  useCrowd: number;
  position: number;
  spuList: unknown;
  spuIds: unknown;
  wmPoiIds: unknown;
  ticketType: number;
}

/** Fields accepted when creating or patching a coupon. */
export interface CouponUpsertInput {
  id?: string;
  name?: string;
  displayName?: string;
  type?: number;
  target?: number;
  status?: number;
  ctime?: number;
  stime?: number;
  etime?: number;
  price?: number;
  discount?: number;
  validDays?: number;
  validStime?: number;
  validEtime?: number;
  sendCount?: number;
  leftCount?: number;
  stock?: number;
  limit?: number;
  putCrowd?: number;
  useCrowd?: number;
  position?: number;
  ticketType?: number;
  rule?: unknown;
  putTerm?: unknown;
  useTerm?: unknown;
  spuList?: unknown;
  spuIds?: unknown;
  wmPoiIds?: unknown;
}

const COUPON_WRITABLE_KEYS = [
  'name',
  'displayName',
  'type',
  'target',
  'status',
  'ctime',
  'stime',
  'etime',
  'price',
  'discount',
  'validDays',
  'validStime',
  'validEtime',
  'sendCount',
  'leftCount',
  'stock',
  'limit',
  'putCrowd',
  'useCrowd',
  'position',
  'ticketType',
  'rule',
  'putTerm',
  'useTerm',
  'spuList',
  'spuIds',
  'wmPoiIds',
] as const;

const COUPON_JSON_KEYS = new Set(['rule', 'putTerm', 'useTerm', 'spuList', 'spuIds', 'wmPoiIds']);

type CouponDraft = Record<string, unknown>;

/** Converts an epoch-second value to an ISO string, keeping nullish values null. */
function toISO(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const seconds = Number(value);
  if (!Number.isFinite(seconds)) {
    return null;
  }

  return new Date(seconds * 1000).toISOString();
}

/** Converts an epoch-second value to a number, rejecting nullish and empty input. */
function toEpoch(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const seconds = Number(value);
  return Number.isFinite(seconds) ? seconds : undefined;
}

function toTerm(value: unknown): [string | null, string | null] {
  const term = Array.isArray(value) ? value : [];

  return [toISO(term[0]), toISO(term[1])];
}

function toCouponListItem(row: Coupon): CouponListItemDTO {
  return {
    id: row.id,
    name: row.name ?? '',
    type: row.type ?? 0,
    target: row.target ?? 0,
    stime: toISO(row.stime),
    etime: toISO(row.etime),
    price: row.price ?? 0,
    discount: row.discount ?? 0,
    validDays: row.validDays ?? 0,
    validStime: toISO(row.validStime),
    validEtime: toISO(row.validEtime),
    sendCount: row.sendCount ?? 0,
    leftCount: row.leftCount ?? 0,
    status: row.status ?? 0,
    useTerm: row.useTerm ?? [],
    putTerm: toTerm(row.putTerm),
    ctime: toISO(row.ctime),
  };
}

function toCouponDetail(row: Coupon): CouponDetailDTO {
  return {
    ...toCouponListItem(row),
    displayName: row.displayName ?? row.name ?? '',
    rule: row.rule ?? [],
    stock: row.stock ?? 0,
    limit: row.limit ?? 0,
    putCrowd: row.putCrowd ?? -1,
    useCrowd: row.useCrowd ?? -1,
    position: row.position ?? 0,
    spuList: row.spuList ?? [],
    spuIds: row.spuIds ?? [],
    wmPoiIds: row.wmPoiIds ?? [],
    ticketType: row.ticketType ?? 0,
  };
}

/** Applies the same detail-column derivations the marketing seed uses. */
function withDerivedDetailFields(attributes: CouponDraft): CouponDraft {
  if (attributes.rule === null || attributes.rule === undefined) {
    attributes.rule = [attributes.price ?? 0, attributes.discount ?? 0];
  }
  if (attributes.stock === null || attributes.stock === undefined) {
    attributes.stock = ((attributes.sendCount as number) ?? 0) + ((attributes.leftCount as number) ?? 0);
  } else {
    if (attributes.sendCount === null || attributes.sendCount === undefined) {
      attributes.sendCount = attributes.stock;
    }
    if (attributes.leftCount === null || attributes.leftCount === undefined) {
      attributes.leftCount = attributes.stock;
    }
  }
  if (attributes.limit === null || attributes.limit === undefined) {
    attributes.limit = 1;
  }
  if (attributes.putTerm === null || attributes.putTerm === undefined) {
    attributes.putTerm = [attributes.stime ?? 0, attributes.etime ?? 0];
  }

  return attributes;
}

/** Maps null JSON columns to Prisma's explicit JSON-null sentinel. */
function toPrismaData(attributes: CouponDraft, includeId: boolean): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (!includeId && key === 'id') {
      continue;
    }
    if (COUPON_JSON_KEYS.has(key)) {
      data[key] = value === null || value === undefined ? Prisma.JsonNull : value;
    } else {
      data[key] = value;
    }
  }

  return data;
}

export async function listCoupons(
  query: CouponListQuery = {}
): Promise<{ total: number; pn: number; ps: number; list: CouponListItemDTO[] }> {
  const { pn, ps, offset } = normalizePagination(query);

  const where: Prisma.CouponWhereInput = {};
  if (query.status !== undefined) {
    where.status = query.status;
  }
  if (query.stime !== undefined) {
    where.stime = { gte: query.stime };
  }
  if (query.etime !== undefined) {
    where.etime = { lte: query.etime };
  }
  if (query.target !== undefined) {
    where.target = query.target;
  }

  const sortField: CouponSortField = query.sort ?? 'ctime';
  const sortDirection: Prisma.SortOrder = query.order === 'asc' ? 'asc' : 'desc';

  // Sort fields are non-unique; the id tiebreaker keeps LIMIT/OFFSET pages
  // stable so a row cannot appear on two pages (or vanish) across requests.
  const orderBy: Prisma.CouponOrderByWithRelationInput[] = [
    { [sortField]: sortDirection } as Prisma.CouponOrderByWithRelationInput,
    { id: 'asc' },
  ];

  const [rows, total] = await Promise.all([
    prisma.coupon.findMany({ where, take: ps, skip: offset, orderBy }),
    prisma.coupon.count({ where }),
  ]);

  const list: CouponListItemDTO[] = [];
  for (const row of rows) {
    list.push(toCouponListItem(row));
  }

  return { total, pn, ps, list };
}

export async function getCoupon(id: string): Promise<CouponDetailDTO> {
  const row = await prisma.coupon.findUnique({ where: { id } });

  if (!row) {
    throw new AppError('NOT_FOUND', 404, '优惠券不存在');
  }

  return toCouponDetail(row);
}

export async function createCoupon(input: CouponUpsertInput): Promise<CouponDetailDTO> {
  const name = input.name ?? '';
  const price = input.price ?? 0;
  const discount = input.discount ?? 0;
  // Leave the counts undefined when omitted so `withDerivedDetailFields` can
  // derive them from `stock`.
  const sendCount = input.sendCount;
  const leftCount = input.leftCount;
  const putTerm = Array.isArray(input.putTerm) ? input.putTerm : [];
  const stime = input.stime ?? Number(putTerm[0] ?? 0);
  const etime = input.etime ?? Number(putTerm[1] ?? 0);

  const attributes = withDerivedDetailFields({
    id: input.id ?? `${Date.now()}`,
    name,
    displayName: input.displayName ?? name,
    type: input.type ?? 0,
    target: input.target ?? 0,
    status: input.status ?? 0,
    ctime: input.ctime ?? Math.floor(Date.now() / 1000),
    stime,
    etime,
    price,
    discount,
    validDays: input.validDays ?? 0,
    validStime: input.validStime ?? 0,
    validEtime: input.validEtime ?? 0,
    sendCount,
    leftCount,
    stock: input.stock,
    limit: input.limit,
    putCrowd: input.putCrowd ?? -1,
    useCrowd: input.useCrowd ?? -1,
    position: input.position ?? 0,
    ticketType: input.ticketType ?? 0,
    rule: input.rule,
    putTerm: input.putTerm ?? [stime, etime],
    useTerm: input.useTerm ?? [],
    spuList: input.spuList ?? [],
    spuIds: input.spuIds ?? [],
    wmPoiIds: input.wmPoiIds ?? [],
  });

  const row = await prisma.coupon.create({
    data: toPrismaData(attributes, true) as Prisma.CouponUncheckedCreateInput,
  });

  return toCouponDetail(row);
}

export async function updateCoupon(id: string, input: Partial<CouponUpsertInput>): Promise<CouponDetailDTO> {
  const existing = await prisma.coupon.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError('NOT_FOUND', 404, '优惠券不存在');
  }

  const attributes: CouponDraft = { ...existing };
  for (const key of COUPON_WRITABLE_KEYS) {
    if (input[key] !== undefined) {
      attributes[key] = input[key];
    }
  }

  if (input.putTerm !== undefined) {
    const putTerm = Array.isArray(input.putTerm) ? input.putTerm : [];
    const stime = toEpoch(putTerm[0]);
    const etime = toEpoch(putTerm[1]);

    if (input.stime === undefined && stime !== undefined) {
      attributes.stime = stime;
    }
    if (input.etime === undefined && etime !== undefined) {
      attributes.etime = etime;
    }
  }

  withDerivedDetailFields(attributes);

  const row = await prisma.coupon.update({
    where: { id },
    data: toPrismaData(attributes, false) as Prisma.CouponUncheckedUpdateInput,
  });

  return toCouponDetail(row);
}

export async function offlineCoupon(id: string): Promise<CouponDetailDTO> {
  await prisma.$transaction(async transaction => {
    const row = await transaction.coupon.findUnique({ where: { id } });

    if (!row) {
      throw new AppError('NOT_FOUND', 404, '优惠券不存在');
    }

    await transaction.coupon.update({ where: { id }, data: { status: 6 } });
  });

  return getCoupon(id);
}
