import { parseBody, parseQuery, withAuth } from '@/lib/handler';
import { createCoupon, listCoupons } from '@/lib/services/coupon';
import { couponListQuerySchema, couponUpsertSchema } from '@/lib/validation/coupon';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async ({ request }) => {
  const query = parseQuery(request, couponListQuerySchema);

  return listCoupons(query);
});

export const POST = withAuth(async ({ request }) => {
  const input = await parseBody(request, couponUpsertSchema);

  return createCoupon(input);
});
