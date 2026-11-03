import { z } from 'zod';

/** Fields shared by coupon create and update payloads. */
const optionalCouponFields = {
  id: z.string().optional(),
  displayName: z.string().optional(),
  type: z.coerce.number().int().optional(),
  target: z.coerce.number().int().optional(),
  status: z.coerce.number().int().optional(),
  ctime: z.coerce.number().int().optional(),
  stime: z.coerce.number().int().optional(),
  etime: z.coerce.number().int().optional(),
  price: z.coerce.number().optional(),
  discount: z.coerce.number().optional(),
  validDays: z.coerce.number().int().optional(),
  validStime: z.coerce.number().int().optional(),
  validEtime: z.coerce.number().int().optional(),
  sendCount: z.coerce.number().int().optional(),
  leftCount: z.coerce.number().int().optional(),
  putCrowd: z.coerce.number().int().optional(),
  useCrowd: z.coerce.number().int().optional(),
  position: z.coerce.number().int().optional(),
  ticketType: z.coerce.number().int().optional(),
  rule: z.array(z.unknown()).optional(),
  putTerm: z.array(z.unknown()).optional(),
  useTerm: z.array(z.unknown()).optional(),
  spuList: z.array(z.unknown()).optional(),
  spuIds: z.array(z.unknown()).optional(),
  wmPoiIds: z.array(z.unknown()).optional(),
};

/** Attaches to `etime` when a supplied range is inverted. */
function checkTimeRange(value: { stime?: number; etime?: number }, ctx: z.RefinementCtx): void {
  if (value.stime !== undefined && value.etime !== undefined && value.etime <= value.stime) {
    ctx.addIssue({ code: 'custom', message: '结束时间必须晚于开始时间', path: ['etime'] });
  }
}

export const couponListQuerySchema = z.object({
  pn: z.coerce.number().int().positive().optional(),
  ps: z.coerce.number().int().positive().max(100).optional(),
  status: z.coerce.number().int().optional(),
  stime: z.coerce.number().int().optional(),
  etime: z.coerce.number().int().optional(),
});

export const couponUpsertSchema = z
  .object({
    name: z.string().trim().min(1),
    stock: z.coerce.number().int().min(1),
    limit: z.coerce.number().int().min(1),
    ...optionalCouponFields,
  })
  .superRefine(checkTimeRange);

export const couponUpdateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    stock: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).optional(),
    ...optionalCouponFields,
  })
  .superRefine(checkTimeRange);
