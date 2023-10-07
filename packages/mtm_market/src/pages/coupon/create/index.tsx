/**
 * 创建优惠券页面
 *
 * sobird<i@sobird.me> at 2023/10/07 10:58:46 created.
 */

import { useParams, useSearchParams } from 'react-router-dom';

const CouponCreate = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const target = searchParams.get('target');
  console.log('params', params, target);

  return <div className='coupon-create-page'>CouponCreate</div>;
};

export default CouponCreate;
