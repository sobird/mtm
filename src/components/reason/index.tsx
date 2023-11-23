/**
 * 原因 组件
 *
 * sobird<i@sobird.me> at 2023/10/26 23:22:28 created.
 */

import { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { Alert, AlertProps } from 'antd';

import './index.scss';

interface ReasonProps extends Omit<AlertProps, 'message' | 'description'> {
  title?: ReactNode;
  list?: string[];
}

const Reason: FC<ReasonProps> = ({
  title = '审核不通过，原因如下：', className, list, ...props
}) => {
  if (!list || !list.length) {
    return;
  }

  const reasons = (
    <ol>
      {list.map((value) => {
        return (
          <li key={value}>{value}</li>
        );
      })}
    </ol>
  );

  return (
    <Alert showIcon className={classNames('mix-reason', className)} {...props} message={title} description={reasons} />
  );
};

export default Reason;
