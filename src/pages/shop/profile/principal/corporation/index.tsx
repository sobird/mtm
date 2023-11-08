/**
 * 公司法人信息
 *
 * sobird<i@sobird.me> at 2023/10/28 10:50:52 created.
 */

import React, { FC, PropsWithChildren } from 'react';
import {Card} from '@mtm/shared'
import { Form, Input, FormProps } from 'antd';

const formItemLayout = {
  labelCol: {
    flex: '0 0 142px',
  },
  wrapperCol: {
    span: 12,
  },
};

interface CorporationProps extends FormProps {
  mode?: 'create' | 'update' | 'detail';
}

const Corporation: FC<PropsWithChildren<CorporationProps>> = ({ mode, ...props }) => {
  const [form] = Form.useForm();

  return (
    <Card title="法人信息" bodyStyle={{paddingTop: 16}}>
      <Form form={form} {...formItemLayout} {...props}>
        <Form.Item
          label='法人姓名'
          name='maskName'
        >
          <Input />
        </Form.Item>

        <Form.Item label='法人电话' name='phone'>
          <Input />
        </Form.Item>

        <Form.Item
          label='法人证件类型'
          name='idCardType'
        >
          <Input />
        </Form.Item>

        <Form.Item
          label='法人证件号'
          name='idCardNo'
        >
          <Input />
        </Form.Item>
        <Form.Item
          label='证件有效期'
          name='term'
        >
          <Input />
        </Form.Item>

        <Form.Item
          label='证件照片'
          name='idCardPhotos'
        >
          <Input />
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Corporation;