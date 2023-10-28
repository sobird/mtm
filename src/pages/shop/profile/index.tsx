/**
 * 店铺信息
 *
 * sobird<i@sobird.me> at 2023/10/23 12:26:30 created.
 */

import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ErrorBoundary, Page } from '@mtm/shared';
import { useAppSelector } from '@/store/hooks';
import Loading from '@/components/loading';

import './index.scss';

const BreadcrumbItem = [
  {
    title: '首页',
    path: '/',
  },
  {
    title: '店铺',
    path: '/shop',
  },
  {
    title: '店铺信息',
    path: 'profile',
  },
];


const ShopProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const merchant = useAppSelector(state => state.merchant);

  // const [activeKey, setActiveKey] = useState();

  const activeKey = params['*'] || '';


  console.log('location', location)

  return (
    <Page
      breadcrumb={{
        items: BreadcrumbItem,
      }}
      tabs={{
        items: [
          {
            key: '/shop/profile',
            label: '基本信息',
          },
          {
            key: '/shop/profile/company',
            label: '主体信息',
          },
          {
            key: '/shop/profile/brand',
            label: '品牌资质',
          },
          {
            label: '店铺经营许可',
            key: '/shop/profile/license',
          },
          {
            label: '钱包信息',
            key: '/shop/profile/wallet',
          },
          {
            label: '结算信息',
            key: '/shop/profile/settlement',
          },
        ],
        activeKey: location.pathname,
        onChange(activeKey) {
          navigate(activeKey);
        },
      }}
      title='店铺信息'
      className='page-shop-profile'
    >
      <div className='shop-profile-body'>
        <ErrorBoundary>
          <Suspense fallback={<Loading />}><Outlet /></Suspense>
        </ErrorBoundary>
      </div>
    </Page>
  );
};

export default ShopProfile;
