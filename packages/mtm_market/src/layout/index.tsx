import {
  GithubFilled,
  InfoCircleFilled,
  QuestionCircleFilled,
} from '@ant-design/icons';

import { PageContainer, ProCard, ProConfigProvider, ProLayout } from '@ant-design/pro-components';
import { Button, ConfigProvider } from 'antd';
import React, { useState } from 'react';
import defaultProps from './_defaultProps';
import SearchInput from './components/search-input';

export default () => {
  const [pathname, setPathname] = useState('/');

  if (typeof document === 'undefined') {
    return <div />;
  }
  return (
    <div
      id='test-pro-layout'
      style={{
        height: '100vh',
        overflow: 'auto',
      }}
    >
      <ProConfigProvider hashed={false}>
        <ConfigProvider
          getTargetContainer={() => {
            return document.getElementById('test-pro-layout') || document.body;
          }}
        >
          <ProLayout
            {...defaultProps}
            location={{
              pathname,
            }}
            actionsRender={props => {
              if (props.isMobile) return [];
              if (typeof window === 'undefined') return [];
              return [
                props.layout !== 'side' && document.body.clientWidth > 1400 ? <SearchInput /> : undefined,
                <a href='https://github.com/sobird/mtm'><GithubFilled key='GithubFilled' /></a>,
              ];
            }}
            headerTitleRender={(logo, title, _) => {
              const defaultDom = (
                <a href="/">
                  {logo}
                  {title}
                </a>
              );
              if (typeof window === 'undefined') return defaultDom;
              if (document.body.clientWidth < 1400) {
                return defaultDom;
              }
              if (_.isMobile) return defaultDom;

              return defaultDom;
            }}
            menuItemRender={(item, dom) => (
              <div
                onClick={() => {
                  console.log('item', item)
                  setPathname(item.path || '/welcome');
                }}
              >
                {dom}
              </div>
            )}
          >
            <PageContainer
              subTitle='简单的描述'
            >
              123
            </PageContainer>
          </ProLayout>
        </ConfigProvider>
      </ProConfigProvider>
    </div>
  );
};
