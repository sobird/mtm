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

  appList: [
    {
      icon: 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
      title: 'Ant Design',
      desc: '杭州市较知名的 UI 设计语言',
      url: 'https://ant.design',
    },
    {
      icon: 'https://gw.alipayobjects.com/zos/antfincdn/FLrTNDvlna/antv.png',
      title: 'AntV',
      desc: '蚂蚁集团全新一代数据可视化解决方案',
      url: 'https://antv.vision/',
      target: '_blank',
    },
    {
      icon: 'https://gw.alipayobjects.com/zos/antfincdn/upvrAjAPQX/Logo_Tech%252520UI.svg',
      title: 'Pro Components',
      desc: '专业级 UI 组件库',
      url: 'https://procomponents.ant.design/',
    },
    {
      icon: 'https://img.alicdn.com/tfs/TB1zomHwxv1gK0jSZFFXXb0sXXa-200-200.png',
      title: 'umi',
      desc: '插件化的企业级前端应用框架。',
      url: 'https://umijs.org/zh-CN/docs',
    },

    {
      icon: 'https://gw.alipayobjects.com/zos/bmw-prod/8a74c1d3-16f3-4719-be63-15e467a68a24/km0cv8vn_w500_h500.png',
      title: 'qiankun',
      desc: '可能是你见过最完善的微前端解决方案🧐',
      url: 'https://qiankun.umijs.org/',
    },
    {
      icon: 'https://gw.alipayobjects.com/zos/rmsportal/XuVpGqBFxXplzvLjJBZB.svg',
      title: '语雀',
      desc: '知识创作与分享工具',
      url: 'https://www.yuque.com/',
    },
    {
      icon: 'https://gw.alipayobjects.com/zos/rmsportal/LFooOLwmxGLsltmUjTAP.svg',
      title: 'Kitchen ',
      desc: 'Sketch 工具集',
      url: 'https://kitchen.alipay.com/',
    },
    {
      icon: 'https://gw.alipayobjects.com/zos/bmw-prod/d3e3eb39-1cd7-4aa5-827c-877deced6b7e/lalxt4g3_w256_h256.png',
      title: 'dumi',
      desc: '为组件开发场景而生的文档工具',
      url: 'https://d.umijs.org/zh-CN',
    },
  ],
};

export default DefaultProps;
