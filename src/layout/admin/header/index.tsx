/**
 * LayoutMain Header
 *
 * sobird<i@sobird.me> at 2023/09/06 22:50:28 created.
 */

import React from 'react';
import { Dropdown } from 'antd';
import { useAppSelector } from '@/store';
import Search from '../search';

import NomalLogo from '@/assets/mtm/logo_title.png';
import SamllLogo from '@/assets/logo.png';
import AvatarDefault from '@/assets/mtm/avatar_default.png';

import AuthService from '@/services/auth';

import './index.scss';

const items = [
  {
    label: '更换登录手机',
    key: 'iphone',
  },
  {
    label: '退出',
    key: 'logout',
  },
];

const onClick = ({ key }) => {
  switch (key) {
    case 'iphone':
      break;
    case 'logout':
      AuthService.logout().then(() => {
        // todo
      });
      break;
    default:
      break;
  }
};

const Header: React.FC = () => {
  const { collapsed } = useAppSelector((state) => { return state.app; });

  return (
    <header className="app-header">
      <div className="header-brand">
        <a href="/" title="美团电商商家管理后台" aria-label="美团电商商家管理后台">
          <img src={collapsed ? SamllLogo : NomalLogo} alt="" />
        </a>
      </div>

      <div className="header-bread">
        <Search />
        <div className="header-nav">
          <Dropdown menu={{ items, onClick }} overlayClassName="avatar-dropdown">
            <div className="app-avatar">
              <img src={AvatarDefault} alt="" />
            </div>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};

export default Header;
