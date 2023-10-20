/**
 * 空数据组件
 * 
 * @todo 
 * 迁移到 @mtm/shared/components
 *
 * sobird<i@sobird.me> at 2021/12/13 20:01:10 created.
 */
import React, { PropsWithChildren, ComponentProps } from 'react';
import { Empty as AntdEmpty } from 'antd';
import image from './assets/empty.png';
import './index.scss';

const Empty: React.FC<PropsWithChildren<ComponentProps<typeof AntdEmpty>>> = ({ children, ...props }) => {
  return (
    <AntdEmpty image={image} imageStyle={{ height: 50 }} description='暂无数据' {...props}>
      {children}
    </AntdEmpty>
  );
};

export default Empty;
