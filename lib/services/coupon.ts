import type { WhereOptions } from 'sequelize';
import { Op } from 'sequelize';

import { sequelize } from '@/lib/db/connection';
import type { CouponAttributes } from '@/lib/db/models';
import { Coupon } from '@/lib/db/models';
import type { PaginationInput } from '@/lib/pagination';
import { normalizePagination } from '@/lib/pagination';

import { AppError } from '../errors';

export interface CouponListQuery extends PaginationInput {
  status?: number;
  stime?: number;
  etime?: number;
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
function withDerivedDetailFields(attributes: Partial<CouponAttributes>): Partial<CouponAttributes> {
  if (attributes.rule === null || attributes.rule === undefined) {
    attributes.rule = [attributes.price ?? 0, attributes.discount ?? 0];
  }
  if (attributes.stock === null || attributes.stock === undefined) {
    attributes.stock = (attributes.sendCount ?? 0) + (attributes.leftCount ?? 0);
  }
  if (attributes.limit === null || attributes.limit === undefined) {
    attributes.limit = 1;
  }
  if (attributes.putTerm === null || attributes.putTerm === undefined) {
    attributes.putTerm = [attributes.stime ?? 0, attributes.etime ?? 0];
  }

  return attributes;
}

export async function listCoupons(
  query: CouponListQuery = {}
): Promise<{ total: number; pn: number; ps: number; list: CouponListItemDTO[] }> {
  const { pn, ps, offset } = normalizePagination(query);

  const where: WhereOptions = {};
  if (query.status !== undefined) {
    where.status = query.status;
  }
  if (query.stime !== undefined) {
    where.stime = { [Op.gte]: query.stime };
  }
  if (query.etime !== undefined) {
    where.etime = { [Op.lte]: query.etime };
  }

  const { rows, count } = await Coupon.findAndCountAll({
    where,
    limit: ps,
    offset,
    order: [['ctime', 'DESC']],
  });

  const list: CouponListItemDTO[] = [];
  for (const row of rows) {
    list.push(toCouponListItem(row));
  }

  return { total: Array.isArray(count) ? count.length : count, pn, ps, list };
}

export async function getCoupon(id: string): Promise<CouponDetailDTO> {
  const row = await Coupon.findByPk(id);

  if (!row) {
    throw new AppError('NOT_FOUND', 404, '优惠券不存在');
  }

  return toCouponDetail(row);
}

export async function createCoupon(input: CouponUpsertInput): Promise<CouponDetailDTO> {
  const name = input.name ?? '';
  const price = input.price ?? 0;
  const discount = input.discount ?? 0;
  const sendCount = input.sendCount ?? 0;
  const leftCount = input.leftCount ?? 0;
  const putTerm = Array.isArray(input.putTerm) ? input.putTerm : [];
  const stime = input.stime ?? Number(putTerm[0] ?? 0);
  const etime = input.etime ?? Number(putTerm[1] ?? 0);

  const attributes: CouponAttributes = withDerivedDetailFields({
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
  }) as CouponAttributes;

  const row = await Coupon.create(attributes);

  return toCouponDetail(row);
}

export async function updateCoupon(id: string, input: Partial<CouponUpsertInput>): Promise<CouponDetailDTO> {
  const row = await Coupon.findByPk(id);

  if (!row) {
    throw new AppError('NOT_FOUND', 404, '优惠券不存在');
  }

  const patch: Partial<CouponAttributes> = {};
  const patchRecord = patch as Record<string, unknown>;
  for (const key of COUPON_WRITABLE_KEYS) {
    if (input[key] !== undefined) {
      patchRecord[key] = input[key];
    }
  }

  row.set(patch);
  withDerivedDetailFields(row as unknown as Partial<CouponAttributes>);

  for (const key of ['rule', 'putTerm', 'useTerm', 'spuList', 'spuIds', 'wmPoiIds'] as const) {
    if (input[key] !== undefined) {
      row.changed(key, true);
    }
  }

  await row.save();

  return toCouponDetail(row);
}

export async function offlineCoupon(id: string): Promise<CouponDetailDTO> {
  await sequelize.transaction(async transaction => {
    const row = await Coupon.findByPk(id, { transaction });

    if (!row) {
      throw new AppError('NOT_FOUND', 404, '优惠券不存在');
    }

    row.status = 6;
    await row.save({ transaction });
  });

  return getCoupon(id);
}
