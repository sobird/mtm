import React, { PropsWithChildren } from 'react';
import { ConfigProvider } from 'antd';
import { ProConfigProvider, ProLayout, ProLayoutProps } from '@ant-design/pro-components';
import { GithubFilled } from '@ant-design/icons';
import defaultProps from './_defaultProps';
import SearchInput from './components/search-input';

interface MTMLayoutProps {
  onMenuItemSelected: () => void;
}

const MTMLayout: React.FC<PropsWithChildren<MTMLayoutProps & ProLayoutProps>> = ({children, ...props}) => {
  if (typeof document === 'undefined') {
    return <div />;
  }
  return (
    <ProConfigProvider hashed={false}>
      <ConfigProvider
        getTargetContainer={() => {
          return document.getElementById('test-pro-layout') || document.body;
        }}
      >
        <ProLayout
          {...defaultProps}
          actionsRender={props => {
            if (props.isMobile) return [];
            if (typeof window === 'undefined') return [];
            return [
              props.layout !== 'side' && document.body.clientWidth > 1400 ? <SearchInput /> : undefined,
              <a href='https://github.com/sobird/mtm'>
                <GithubFilled key='GithubFilled' />
              </a>,
            ];
          }}
          headerTitleRender={(logo, title, _) => {
            const defaultDom = (
              <a href='/'>
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
          {...props}
        >
          {children}
        </ProLayout>
      </ConfigProvider>
    </ProConfigProvider>
  );
};

export default MTMLayout;
