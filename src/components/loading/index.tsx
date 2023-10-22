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
        position: "absolute",
        left: '50%',
        top: '30%',
        transform: 'translate(-50%, -50%)',
      }}
      indicator={<LoadingOutlined />}
    />
  );
}
