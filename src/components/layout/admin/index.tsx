/**
 * 商家管理后台 布局组件
 *
 * sobird<i@sobird.me> at 2023/09/06 16:47:45 created.
 */
import React, { PropsWithChildren, Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Watermark } from 'antd';
import classNames from 'classnames';
import Header from './header';
import Aside from './aside';
import ErrorBoundary from "@/components/error-boundary";
import Loading from '@/components/loading';
import { IStoreState } from "@/store/reducers";
import startQiankun from '@/router/micro';

import './index.scss';

const LayoutAdmin: React.FC<PropsWithChildren> = ({ children }) => {
  const location = useLocation();
  const { collapsed, micro } = useSelector((state: IStoreState) => state.app);
  console.log('micro', micro)
  useEffect(() => {
    if (!window.qiankunStarted) {
      window.qiankunStarted = true;
      startQiankun();
    }
  }, []);

  // 路由守卫配置
  useEffect(() => {
    console.log('entry', location.pathname);

    return () => {
      console.log('leave', location.pathname);
    }
  }, [location.pathname]);

  return (
    <>
      <div
        className={classNames('app-container', {
          "aside-collapsed": collapsed,
        })}
      >
        <Header />
        <div className='app-body'>
          <Aside />
          <main className='app-main'>
            <div id="micro-container" style={{ width: '100%', height: "100px" }} >
              {micro.loading ? <Loading /> : null}
            </div>
            {children ? children : (
              <ErrorBoundary>
                <Suspense fallback={<Loading />}><Outlet /></Suspense>
              </ErrorBoundary>
            )}
          </main>
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
