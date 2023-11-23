/**
 * Loading
 *
 * sobird<i@sobird.me> at 2023/09/21 13:54:04 created.
 */

import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export default function Loading() {
  return (
    <Spin
      style={{
        margin: '100px auto',
        display: 'block',
        // transform: 'translate(-50%, -50%)',
      }}
      indicator={<LoadingOutlined />}
    />
  );
}
