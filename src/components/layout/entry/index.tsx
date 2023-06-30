/**
 * 商家入住通用布局组件
 * 
 * sobird<i@sobird.me> at 2023/06/22 23:01:25 created.
 */


import React, { PropsWithChildren } from 'react';
import { Dropdown, MenuProps } from 'antd';
import mtmLogo from '@/assets/mtm_logo.png';
import policeIcon from '@/assets/police_icon.png';
import './index.scss';

const Entry: React.FC<PropsWithChildren> = ({ children }) => {
  const items: MenuProps['items'] = [
    {
      label: '退出登录',
      key: '1',
    },
  ];
  const onClick: MenuProps['onClick'] = ({ key }) => {
    // 
  };
  return (
    <div className='layout-entry'>
      <div className='entry-header'>
        <div className='entry-header-box'>
          <div className='header-logo'>
            <img className='logo' src={mtmLogo} />
            <span>商家入驻平台</span>
          </div>
          <div className="header-item">
            <Dropdown menu={{items, onClick}}>
              <span className='username'>sobird</span>
            </Dropdown>
          </div>
        </div>
      </div>
      <div className='entry-body'>
        {children}
      </div>
    </div>
  );
};

export default Entry;