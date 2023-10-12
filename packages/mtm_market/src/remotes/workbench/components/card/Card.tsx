/**
 * 数据卡片容器
 *
 * sobird<i@sobird.me> at 2023/10/12 9:15:20 created.
 */

import React, { PropsWithChildren, ComponentProps } from 'react';
import classNames from 'classnames';
import Grid from './Grid';

import './Card.scss';

export interface CardProps extends Omit<ComponentProps<'div'>, 'title'> {
  prefixCls?: string;
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  extra?: React.ReactNode;
  bordered?: boolean;
  headStyle?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
}

const Card: React.FC<PropsWithChildren<CardProps>> = ({
  prefixCls = 'mix',
  title,
  subTitle,
  extra,
  className,
  headStyle,
  bodyStyle,
  children,
  ...props
}) => {
  const isContainGrid = React.useMemo<boolean>(() => {
    let containGrid = false;
    React.Children.forEach(children, (element: JSX.Element) => {
      if (element && element.type && element.type === Grid) {
        containGrid = true;
      }
    });
    return containGrid;
  }, [children]);
  console.log('isContainGrid', isContainGrid);
  let head: React.ReactNode;
  if (title || subTitle || extra) {
    head = (
      <div className={`${prefixCls}-card-head`} style={headStyle}>
        <div className={`${prefixCls}-card-head-title`}>
          {title}
          {subTitle && <span className={`${prefixCls}-card-head-title-sub`}>{subTitle}</span>}
        </div>
        {extra && <div className={`${prefixCls}-card-head-extra`}>{extra}</div>}
      </div>
    );
  }
  return (
    <div
      className={classNames('mix-card', className, {
        [`${prefixCls}-card-contain-grid`]: isContainGrid,
      })}
      {...props}
    >
      {head}
      <div className={`${prefixCls}-card-body`} style={bodyStyle}>
        {children}
      </div>
    </div>
  );
};

export default Card;
