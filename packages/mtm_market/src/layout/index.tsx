import React, { PropsWithChildren, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { ProConfigProvider, ProLayout, ProLayoutProps } from '@ant-design/pro-components';
import { GithubFilled } from '@ant-design/icons';
import defaultProps from './_defaultProps';
import SearchInput from './components/search-input';

interface MTMLayoutProps {
  onMenuItemSelected?: (item: ProLayoutProps['route']) => void;
}

const MTMLayout: React.FC<PropsWithChildren<MTMLayoutProps & ProLayoutProps>> = ({children, onMenuItemSelected, ...props}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pathname, setPathname] = useState(location.pathname);

  return (
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
          menuItemRender={(item, dom) => (
            <div
              onClick={() => {
                setPathname(item.path || '/welcome');
                navigate(item.path);
                // onMenuItemSelected?.(item)
              }}
            >
              {dom}
            </div>
          )}
          {...props}
        >
          {children}
        </ProLayout>
      </ConfigProvider>
    </ProConfigProvider>
  );
};

export default MTMLayout;
