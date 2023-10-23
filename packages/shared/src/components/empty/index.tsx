/**
 * 空数据组件
 *
 * sobird<i@sobird.me> at 2021/12/13 20:01:10 created.
 */
import React, { PropsWithChildren, ComponentProps } from 'react';
import { Empty as AntdEmpty } from 'antd';
import image from './images/empty.png';
import './index.scss';

const Empty: React.FC<PropsWithChildren<ComponentProps<typeof AntdEmpty>>> = ({ children, ...props}) =>{
  return (
    <AntdEmpty image={image} imageStyle={{ height: 60 }} description="暂无数据" {...props}>{children}</AntdEmpty>
  );
}

export default Empty;
