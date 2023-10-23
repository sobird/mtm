/**
 * 页面容器
 *
 * sobird<i@sobird.me> at 2023/10/07 15:39:45 created.
 */

import React, { ReactNode, CSSProperties, PropsWithChildren, ComponentProps } from 'react';
import { Link, createHashRouter } from 'react-router-dom';
import { Breadcrumb, BreadcrumbProps } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import './index.scss';

const router = createHashRouter([{}]);

export interface PageProps extends Omit<ComponentProps<'div'>, 'title'> {
  prefixCls?: string;
  title?: ReactNode;
  breadcrumb?: BreadcrumbProps;
  description?: string;
  extra?: ReactNode[];
  titleIcon?: ReactNode;
  headStyle?: CSSProperties;
  bodyStyle?: CSSProperties;
}

function itemRender(item, params, items, paths: string[]) {
  let path = item.path;
  const last = items.indexOf(item) === items.length - 1;
  if (last) {
    return <span>{item.title}</span>;
  }
  if (item.href) {
    return (
      <a
        href={router.createHref({
          pathname: item.href,
        } as any)}
        onClick={e => {
          e.preventDefault();
          router.navigate(item.href);
        }}
      >
        {item.title}
      </a>
    );
  }

  if (item.path?.indexOf('/') !== 0) {
    path = '/' + paths.filter(item => item).join('/');
  }

  return last ? (
    <span>{item.title}</span>
  ) : (
    <Link to={path} relative='route'>
      {item.title}
    </Link>
  );
}

const Page: React.FC<PropsWithChildren<PageProps>> = ({
  prefixCls = 'mix',
  title,
  titleIcon,
  description,
  breadcrumb,
  extra,
  children,
  headStyle,
  bodyStyle,
  ...props
}) => {
  let head: React.ReactNode;
  if (title || description || extra || breadcrumb) {
    head = (
      <div className={`${prefixCls}-page-head`} style={headStyle}>
        {breadcrumb && (
          <Breadcrumb
            className={`${prefixCls}-page-head-breadcrumb`}
            separator={<RightOutlined />}
            itemRender={itemRender}
            {...breadcrumb}
          />
        )}

        <div className={`${prefixCls}-page-head-title`}>
          <h2>
            {typeof titleIcon === 'string' ? <i className={`iconfont icon-${titleIcon}`} /> : titleIcon}
            {title}
          </h2>
          {extra && <div className={`${prefixCls}-page-head-extra`}>{extra}</div>}
        </div>

        {description && <div className={`${prefixCls}-page-head-description`}>{description}</div>}
      </div>
    );
  }
  return (
    <div className={`${prefixCls}-page`} {...props}>
      {head}
      <div style={bodyStyle} className={`${prefixCls}-page-body`}>
        {children}
      </div>
    </div>
  );
};

export default Page;
