/**
 * 商家管理后台 布局组件
 *
 * sobird<i@sobird.me> at 2023/09/06 16:47:45 created.
 */
import React, { PropsWithChildren, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Watermark } from 'antd';
import classNames from 'classnames';
import Header from './header';
import Aside from './aside';
import ErrorBoundary from "@/components/error-boundary";
import Loading from '@/components/loading';

import './index.scss';

const LayoutAdmin: React.FC<PropsWithChildren> = ({ children }) => {
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
          <main className='app-main'>
            {children ? children : (
              <ErrorBoundary>
                <Suspense fallback={<Loading />}><Outlet /></Suspense>
              </ErrorBoundary>
            )}</main>
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

export default LayoutAdmin;
