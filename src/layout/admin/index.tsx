/**
 * 商家管理后台 布局组件
 *
 * sobird<i@sobird.me> at 2023/09/06 16:47:45 created.
 */
import React, { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import classNames from 'classnames';
import { Watermark } from 'antd';
import startQiankun from '@/router/micro';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { ErrorBoundary } from "@mtm/shared";
import Loading from '@/components/loading';
import Notifier from '@/components/notifier';
import { fetchMerchantThunkAction } from '@/store/actions/merchant';
import Header from './header';
import Aside from './aside';
import { palyAudio } from '@/utils';

import './index.scss';

const LayoutAdmin: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { collapsed, micro } = useAppSelector((state) => state.app);

  useEffect(() => {
    // 获取商家详情
    dispatch(fetchMerchantThunkAction);
    // palyAudio();

    window.palyAudio = palyAudio;

    setTimeout(() => {
      palyAudio();
    }, 3000);
    

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
            <div id="micro-container" style={{ width: '100%' }} ></div>
            <div id="main-container" style={{ width: '100%' }} >
              <ErrorBoundary>
                <Suspense fallback={<Loading />}><Outlet /></Suspense>
              </ErrorBoundary>
            </div>
            {micro.loading ? <Loading /> : null}
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
      <Notifier />
    </>
  );
}

export default LayoutAdmin;
