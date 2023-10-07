/**
 * 创建优惠券页面
 *
 * sobird<i@sobird.me> at 2023/10/07 10:58:46 created.
 */

import { useParams, useSearchParams } from 'react-router-dom';
import { PlusCircleOutlined } from '@ant-design/icons';
import PageContainer from '@/layout/page-container';

const BreadcrumbItem = [
  {
    title: '首页',
    href: '/',
  },
  {
    title: '营销中心',
    path: '/',
  },
  {
    title: '优惠券',
    path: 'coupons',
  },
  {
    title: '创建优惠券',
    path: 'create',
  },
];

const CouponCreate = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const target = searchParams.get('target');
  console.log('params', params, target);

  return (
    <PageContainer
      breadcrumb={{
        items: BreadcrumbItem,
      }}
      title='创建优惠券'
      // icon={<PlusCircleOutlined />}
      extra={[]}
    >
      <div className='coupon-create-page'>CouponCreate</div>
    </PageContainer>
  );
};

export default CouponCreate;
