/**
 * View 数据展示组件
 *
 * sobird<i@sobird.me> at 2023/10/12 16:01:11 created.
 */

import React from 'react';
import classNames from 'classnames';
import { Tooltip, TooltipProps } from 'antd';
import './View.scss';

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
  tooltip?: TooltipProps;
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
  tooltip,
  ...props
}) => {
  const classString = classNames(`${prefixCls}-card-view`, className, {
    [`${prefixCls}-card-view-bordered`]: bordered,
    [`${prefixCls}-card-view-hoverable`]: hoverable,
  });
  return (
    <div {...props} className={classString}>
      <div className={`${prefixCls}-card-view-title`}>
        {tooltip?.title ? (
          <Tooltip overlayInnerStyle={{ color: '#333', fontSize: 12 }} color='#fff' {...tooltip}>
            <span>{title}</span>
          </Tooltip>
        ) : (
          title
        )}
      </div>
      <div className={`${prefixCls}-card-view-content`}>
        <span className={`${prefixCls}-card-view-value`}>{value || '--'}</span>
        <span className={`${prefixCls}-card-view-unit`}>{unit}</span>
      </div>
      <div className={`${prefixCls}-card-view-extra`}>{extra}</div>
    </div>
  );
};

export default View;
