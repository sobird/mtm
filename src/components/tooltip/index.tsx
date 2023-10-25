/**
 * Tooltip
 *
 * sobird<i@sobird.me> at 2023/10/25 12:03:08 created.
 */

import React, { FC, PropsWithChildren, ComponentProps } from 'react';
import { Tooltip as AntdTooltip } from 'antd';

const Tooltip: FC<PropsWithChildren<ComponentProps<typeof AntdTooltip>>> = ({ children, ...props }) => {
  return (
    <AntdTooltip color='#fff' overlayInnerStyle={{ fontSize: 12, color: '#333' }} {...props}>
      {children}
    </AntdTooltip>
  );
};

export default Tooltip;
