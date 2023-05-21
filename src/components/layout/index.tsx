/**
 * SPA Layout
 *
 * sobird<i@sobird.me> at 2021/07/02 15:02:37 created.
 */

import React from 'react';
import { connect } from 'react-redux';
import Header from '@/components/layout/header';
import Aside from '@/components/layout/aside';
import { IStoreState } from '@/store/reducers';
import { IAppState } from '@/store/reducers/app';

import './index.scss';

interface LayoutProps {
  app: IAppState;
  children: React.ReactNode;
}

function Layout(props: LayoutProps) {
  const { app: { collapsed } } = props;

  return (
    <>
      <div className={`app-container ${collapsed ? 'aside-collapsed' : ''}`}>
        <Header />
        <div className="app-body">
          <Aside />
          <main>{props.children}</main>
        </div>
      </div>
      <div
        className="mt-watermark"
        style={{
          backgroundImage: 'url(/api-wm/image/visible?deg=-20&type=4)',
          backgroundSize: '330px, auto',
          position: 'fixed',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          zIndex: 999999,
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

const mapStateToProps = (state: IStoreState) => ({ app: state.app });

export default connect(mapStateToProps)(Layout);
