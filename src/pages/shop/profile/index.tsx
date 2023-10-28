/**
 * 店铺信息
 *
 * sobird<i@sobird.me> at 2023/10/23 12:26:30 created.
 */

import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useNavigate, useParams } from 'react-router-dom';
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
  const params = useParams();
  const merchant = useAppSelector(state => state.merchant);

  // const [activeKey, setActiveKey] = useState();

  const activeKey = params['*'] || '';

  return (
    <Page
      breadcrumb={{
        items: BreadcrumbItem,
      }}
      tabs={{
        items: [
          {
            key: '',
            label: '基本信息',
          },
          {
            key: 'object',
            label: '主体信息',
          },
          {
            key: 'brand',
            label: '品牌资质',
          },
          {
            label: '店铺经营许可',
            key: 'license',
          },
          {
            label: '钱包信息',
            key: 'wallet',
          },
          {
            label: '结算信息',
            key: 'settlement',
          },
        ],
        activeKey: activeKey,
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
