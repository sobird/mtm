/**
 * 商家后台SPA Layout
 *
 * sobird<i@sobird.me> at 2023/09/06 16:47:45 created.
 */
import React, { PropsWithChildren } from 'react';
import { Watermark } from 'antd';
import classNames from 'classnames';
import Header from './header';
import Aside from './aside';
import './index.scss';

const LayoutMain: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <div
        className={classNames('app-container', {
          mounted: true,
        })}
      >
        <Header />
        <div className='app-body'>
          <Aside />
          <main className='app-main'>{children}</main>
        </div>
      </div>
      <Watermark
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          zIndex: 999999,
          pointerEvents: 'none',
        }}
        font={{
          color: '#eee',
        }}
        content='sobird.me'
        gap={[350, 350]}
      >
      </Watermark>
    </>
  );
}

export default LayoutMain;
