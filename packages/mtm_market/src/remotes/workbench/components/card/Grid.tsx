import classNames from 'classnames';
import * as React from 'react';

export interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  prefixCls?: string;
  className?: string;
  hoverable?: boolean;
  style?: React.CSSProperties;
}

const Grid: React.FC<CardGridProps> = ({ prefixCls = 'mix', className, hoverable = true, ...props }) => {
  const classString = classNames(`${prefixCls}-card-grid`, className, {
    [`${prefixCls}-card-grid-hoverable`]: hoverable,
  });
  return <div {...props} className={classString} />;
};

export default Grid;