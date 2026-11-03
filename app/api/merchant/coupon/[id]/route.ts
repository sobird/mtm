import { parseBody, withAuth } from '@/lib/handler';
import { getCoupon, offlineCoupon, updateCoupon } from '@/lib/services/coupon';
import { couponUpdateSchema } from '@/lib/validation/coupon';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async ({ params }) => getCoupon(params.id));

export const PATCH = withAuth(async ({ request, params }) => {
  const input = await parseBody(request, couponUpdateSchema);

  return updateCoupon(params.id, input);
});

export const DELETE = withAuth(async ({ params }) => offlineCoupon(params.id));
