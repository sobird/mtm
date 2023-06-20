/**
 * 通用布局页面
 *
 * sobird<i@sobird.me> at 2023/06/13 22:39:58 created.
 */

import React, { PropsWithChildren } from 'react';
import mtmLogo from '@/assets/mtm_logo.png';
import policeIcon from '@/assets/police_icon.png';
import './index.scss';

interface BaseProps {
  hasWindow?: boolean;
  hasBackground?: boolean;
}

const Base: React.FC<PropsWithChildren<BaseProps>> = ({ children, hasWindow = true, hasBackground = true }) => {
  return (
    <div className='layout-base'>
      <div className='base-header'>
        <div className='base-header-box'>
          <img src={mtmLogo} />
        </div>
      </div>
      <div className='base-body' style={{background: hasBackground ? '' : 'none'}}>
        {hasWindow ? <div className='base-body-box'><div className='base-window'>{children}</div></div> : children}
      </div>
      <div className='base-footer'>
        <div className='copyright'>
          <a target='_blank' href='https://beian.miit.gov.cn' rel='noreferrer'>
            <span>©2020 meituan.com 京ICP备10211739号</span>
          </a>
          <img src={policeIcon} />
          <a
            target='_blank'
            href='http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11000002002052'
            rel='noreferrer'
          >
            <span>京公网安备11000002002052号</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Base;
