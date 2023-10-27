/**
 * 店铺信息
 *
 * sobird<i@sobird.me> at 2023/10/23 12:26:30 created.
 */

import { Tabs } from 'antd';
import { Page } from '@mtm/shared';
import FieldMerchantLogo from '@/components/field-merchant-logo';
import BaseInfo from './base-info';
import './index.scss';

import { useAppSelector } from '@/store/hooks';

const {TabPane} = Tabs;

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
  const merchant = useAppSelector((state) => state.merchant);
  console.log('merchant', merchant)
  return (
    <Page
      breadcrumb={{
        items: BreadcrumbItem,
      }}
      tabs={{
        items: [{
          key: 'base',
          label: "基本信息"
        },{
          key: 'object',
          label: "主体信息"
        },{
          key: "brand",
          label: "品牌资质"
        },{
          label: "店铺经营许可",
          key: "license-info"
        }, {
          label: "钱包信息",
          key: "settle-info"
        }, {
          label: "结算信息",
          key: "compute-info"
        }]
      }}
      title='店铺信息'
      className='page-shop-profile'
    >
      <div className="shop-profile-body">
        <BaseInfo />
      </div>
    </Page>
  );
};

export default ShopProfile;
