/**
 * View 业务级组件
 *
 * sobird<i@sobird.me> at 2023/10/12 16:01:11 created.
 */

import React from 'react';
import classNames from 'classnames';

export interface CardViewProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  prefixCls?: string;
  className?: string;
  hoverable?: boolean;
  style?: React.CSSProperties;
  title: React.ReactNode;
  unit?: string;
  value: React.ReactNode;
  extra?: React.ReactNode;
  bordered?: true;
}

const View: React.FC<CardViewProps> = ({
  prefixCls = 'mix',
  className,
  hoverable = true,
  title,
  value,
  unit,
  extra,
  bordered,
  ...props
}) => {
  const classString = classNames(`${prefixCls}-card-view`, className, {
    [`${prefixCls}-card-view-bordered`]: bordered,
    [`${prefixCls}-card-view-hoverable`]: hoverable,
  });
  return (
    <div {...props} className={classString}>
      <div className={`${prefixCls}-card-view-title`}>{title}</div>
      <div className={`${prefixCls}-card-view-content`}>
        <span className={`${prefixCls}-card-view-value`}>{value || "--"}</span>
        <span className={`${prefixCls}-card-view-unit`}>{unit}</span>
      </div>
      <div className={`${prefixCls}-card-view-extra`}>{extra}</div>
    </div>
  );
};

export default View;
