/**
 * ProLayout defaultProps
 *
 * @see https://procomponents.ant.design/components/layout
 * sobird<i@sobird.me> at 2023/09/26 7:21:58 created.
 */

import { Dropdown } from 'antd';
import { ProLayoutProps } from '@ant-design/pro-components';
import { LogoutOutlined, SmileFilled } from '@ant-design/icons';
import Logo from './assets/logo.png';
import AvatarDefault from './assets/avatar_default.png';

const DefaultProps: ProLayoutProps = {
  prefixCls: 'mtm',
  token: {
    header: {
      colorBgMenuItemSelected: 'rgba(0,0,0,0.04)',
    },
  },
  title: '商家后台',
  logo: Logo,
  pure: false,
  layout: 'mix',
  avatarProps: {
    src: AvatarDefault,
    size: 'small',
    title: '团好货',
    render: (props, dom) => {
      return (
        <Dropdown
          menu={{
            items: [
              {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: '退出登录',
              },
            ],
          }}
        >
          {dom}
        </Dropdown>
      );
    },
  },

  location: {
    pathname: '/',
  },
  route: {
    path: '/',
    name: '首页',
    routes: [
      {
        path: '/admin',
        name: '营销中心',
        icon: <SmileFilled />,
        access: 'canAdmin',
        routes: [
          {
            path: '/activities',
            name: '营销活动',
          },
          {
            path: '/coupons',
            name: '优惠券',
          },
          {
            path: '/promotion',
            name: '限时限量促销',
          },
          {
            path: '/discount',
            name: '满件打折',
          },
          {
            path: '/cps',
            name: '团销宝数据',
          },
          {
            path: '/shop',
            name: '随手买',
          },
        ],
      },
    ],
  },
  siderMenuType: 'sub',
  splitMenus: false,
  menu: {
    defaultOpenAll: true,
  },

  appList: [],
};

export default DefaultProps;
