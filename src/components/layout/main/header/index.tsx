/**
 * LayoutMain Header
 * 
 * sobird<i@sobird.me> at 2023/09/06 22:50:28 created.
 */

import React from 'react';
import { Dropdown } from 'antd';
import LogoTitle from '@/assets/mtm/logo_title.png';
import AvatarDefault from '@/assets/mtm/avatar_default.png';

import './index.scss';

const Header: React.FC = () => {
  const menu = [
    {
      label: '更换登录手机',
      key: 1
    },
    {
      label: '退出',
      key: 2
    },
  ];

  return (
    <div className="layout-main-header">
      <div className="mtm-brand">
        <a href="/" title="美团电商商家管理后台">
          <img src={LogoTitle}></img>
        </a>
      </div>

      <Dropdown
        menu={{items: menu}}
        overlayClassName="dropdown-overlay"
      >
        <div className="mtm-avatar">
          <img src={AvatarDefault} />
        </div>
      </Dropdown>
    </div>
  )
}

export default Header;
