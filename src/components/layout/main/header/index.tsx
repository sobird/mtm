/**
 * LayoutMain Header
 * 
 * sobird<i@sobird.me> at 2023/09/06 22:50:28 created.
 */

import React from 'react';
import { Dropdown, Input, Popover } from 'antd';
import { AudioOutlined } from '@ant-design/icons';
import Search from '../search';

import LogoTitle from '@/assets/mtm/logo_title.png';
import AvatarDefault from '@/assets/mtm/avatar_default.png';

import './index.scss';


const content = (
  <div style={{width: '300px'}}>
    <p>Content</p>
    <p>Content</p>
  </div>
);

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

  const suffix = (
    <AudioOutlined
      style={{
        fontSize: 16,
        color: '#1677ff',
      }}
    />
  );

  return (
    <div className="layout-main-header">
      <div className="header-brand">
        <a href="/" title="美团电商商家管理后台">
          <img src={LogoTitle}></img>
        </a>
      </div>

      <div className="header-bread">
        <Search />
        <div className="header-nav">
          <Dropdown
            menu={{items: menu}}
            overlayClassName="avatar-dropdown"
          >
            <div className="mtm-avatar">
              <img src={AvatarDefault} />
            </div>
          </Dropdown>
        </div>
      </div>
    </div>
  )
}

export default Header;
