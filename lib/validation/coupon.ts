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

/**
 * Client-side coupon form schema. Term values are epoch seconds and `useTerm`
 * is either `[days]` (valid for N days after claiming) or
 * `[days, [start, end]]` (absolute window). Both shapes intentionally coexist
 * to keep the desktop form and the API payload compatible (R-54).
 */
const useTermSchema = z.union([
  z.tuple([z.coerce.number().int()]),
  z.tuple([z.coerce.number().int(), z.tuple([z.coerce.number().int(), z.coerce.number().int()])]),
]);

export const couponFormSchema = z
  .object({
    name: z.string().trim().min(1, '请填写优惠券名称').max(10, '优惠券名称最多填写10个字'),
    displayName: z.string().trim().min(1, '请填写优惠券文案'),
    type: z.coerce.number().int(),
    target: z.coerce.number().int(),
    rule: z.tuple([z.coerce.number(), z.coerce.number()]),
    stock: z.coerce.number().int().min(1, '发放张数必须大于 0'),
    limit: z.coerce.number().int().min(1, '每人限领张数必须大于 0'),
    putTerm: z.tuple([z.coerce.number().int(), z.coerce.number().int()]),
    putCrowd: z.coerce.number().int(),
    useTerm: useTermSchema,
    useCrowd: z.coerce.number().int(),
    position: z.coerce.number().int(),
  })
  .superRefine((value, ctx) => {
    if (value.putTerm[0] >= value.putTerm[1]) {
      ctx.addIssue({ code: 'custom', message: '结束时间必须晚于开始时间', path: ['putTerm'] });
    }
  });

export type CouponFormValues = z.infer<typeof couponFormSchema>;
