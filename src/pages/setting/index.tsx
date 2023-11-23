/**
 * Setting
 *
 * sobird<i@sobird.me> at 2023/10/20 20:04:32 created.
 */
import { Outlet } from 'react-router-dom';
import { Menu, Button } from 'antd';
import type { MenuProps } from 'antd';
import { Page } from '@mtm/shared';

const items: MenuProps['items'] = [
  {
    key: 1,
    label: '基本信息',
  },
  {
    key: 2,
    label: '登录密码',
  },
  {
    key: 3,
    label: '手机号码',
  },
  {
    key: 4,
    label: '登录设置',
  },
  {
    key: 5,
    label: '登录记录',
  },
];

const BreadcrumbItem = [
  {
    title: '首页',
    href: '/',
  },
  {
    title: '账户设置',
    path: 'setting',
  },
];

const Setting = () => {
  return (
    <Page
      breadcrumb={{
        items: BreadcrumbItem,
      }}
      title="账户设置"
      extra={[<Button>操作</Button>]}
      bodyStyle={{
        flexDirection: 'row',
        gap: 15,
      }}
    >
      <Menu style={{ width: 200 }} defaultSelectedKeys={['1']} defaultOpenKeys={['sub1']} mode="inline" items={items} />
      <Outlet />
    </Page>
  );
};

export default Setting;
