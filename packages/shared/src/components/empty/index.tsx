/**
 * 空数据组件
 *
 * sobird<i@sobird.me> at 2021/12/13 20:01:10 created.
 */
import React, { PropsWithChildren } from 'react';
import classNames from 'classnames';
import defaultEmptyImg from './assets/empty.png';
import './index.scss';

export interface EmptyProps {
  prefixCls?: string;
  className?: string;
  rootClassName?: string;
  style?: React.CSSProperties;
  imageStyle?: React.CSSProperties;
  image?: React.ReactNode;
  description?: React.ReactNode;
}

const Empty: React.FC<PropsWithChildren<EmptyProps>> = ({
  prefixCls = 'mix',
  className,
  rootClassName,
  image = defaultEmptyImg,
  description,
  children,
  imageStyle,
  ...props
}) => {
  const _prefixCls = `${prefixCls}-empty`;

  const des = typeof description !== 'undefined' ? description : '暂无数据';
  const alt = typeof des === 'string' ? des : 'empty';

  let imageNode: React.ReactNode = null;

  if (typeof image === 'string') {
    imageNode = <img alt={alt} src={image} />;
  } else {
    imageNode = image;
  }

  return (
    <div
      className={classNames(
        _prefixCls,
        className,
        rootClassName
      )}
      {...props}
    >
      <div className={`${_prefixCls}-image`} style={imageStyle}>
        {imageNode}
      </div>
      {des && <div className={`${_prefixCls}-description`}>{des}</div>}
      {children && <div className={`${_prefixCls}-footer`}>{children}</div>}
    </div>
  );
};

export default Empty;
