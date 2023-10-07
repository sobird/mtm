/**
 * 页面头组件
 *
 * sobird<i@sobird.me> at 2023/10/07 15:39:45 created.
 */

import React, { ReactNode, PropsWithChildren } from 'react';
import { Link, createHashRouter } from 'react-router-dom';
import { Breadcrumb, BreadcrumbProps, Col, Row, Space } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import './index.scss';

const router = createHashRouter([{}]);

interface PageContainerProps {
  title?: ReactNode;
  breadcrumb?: BreadcrumbProps;
  description?: string;
  extra?: ReactNode[];
  icon?: ReactNode;
}

function itemRender(item, params, items, paths) {
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
    path = '/' + paths.join('/');
  }
  return last ? (
    <span>{item.title}</span>
  ) : (
    <Link to={path} relative='route'>
      {item.title}
    </Link>
  );
}

const PageContainer: React.FC<PropsWithChildren<PageContainerProps>> = ({
  children,
  breadcrumb,
  title,
  icon,
  description,
  extra,
  ...props
}) => {

  return (
    <div className='micro-page-container' {...props}>
      <div className='micro-page-header'>
        <Breadcrumb
          className='micro-breadcrumb'
          separator={<RightOutlined />}
          itemRender={itemRender}
          {...breadcrumb}
        />
        <Row className='micro-page-header-heading' align='middle'>
          <Col flex={1}>
            <h2>{typeof icon === 'string' ? <i className={`iconfont icon-${icon}`} /> : icon}{title}</h2>
          </Col>
          <Col>
            <Space>{extra}</Space>
          </Col>
        </Row>
        {description && <div className='micro-page-header-description'>{description}</div>}
      </div>
      <div className='micor-page-content'>{children}</div>
    </div>
  );
};

export default PageContainer;