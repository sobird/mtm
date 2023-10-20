/**
 * LayoutMain Header
 *
 * sobird<i@sobird.me> at 2023/09/06 22:50:28 created.
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { Dropdown } from 'antd';
import { IStoreState } from '@/store/reducers';
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
  //

  console.log('key', key);

  switch (key) {
    case 'iphone':
      break;
    case 'logout':
      AuthService.logout().then(res => {
        console.log('res', res);
        // todo
      });
      break;
    default:
      break;
  }
};

const Header: React.FC = () => {
  const { collapsed } = useSelector((state: IStoreState) => state.app);

  return (
    <header className='app-header'>
      <div className='header-brand'>
        <a href='/' title='美团电商商家管理后台'>
          <img src={collapsed ? SamllLogo : NomalLogo}></img>
        </a>
      </div>

      <div className='header-bread'>
        <Search />
        <div className='header-nav'>
          <Dropdown menu={{ items, onClick }} overlayClassName='avatar-dropdown'>
            <div className='app-avatar'>
              <img src={AvatarDefault} />
            </div>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};

export default Header;
