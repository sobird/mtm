/**
 * 店铺主体信息 公司信息
 *
 * sobird<i@sobird.me> at 2023/10/28 10:50:52 created.
 */

import React, { FC, PropsWithChildren } from 'react';
import classNames from 'classnames';
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

interface EnteredCompanyProps extends FormProps {
  mode?: 'create' | 'update' | 'detail';
}

const EnteredCompany: FC<PropsWithChildren<EnteredCompanyProps>> = ({ mode, ...props }) => {
  const [form] = Form.useForm();

  return (
    <Card title="企业信息" bodyStyle={{paddingTop: 16}}>
      <Form form={form} {...formItemLayout} {...props}>
        <Form.Item
          label='营业执照'
          name='businessLicense'
        >
          <Input placeholder='请输入邮箱地址' />
        </Form.Item>

        <Form.Item label='执照有效期' name='operatingTime'>
          <Input placeholder='请您及时填写客服电话' />
        </Form.Item>

        <Form.Item
          label='统一社会信用代码'
          name='socialCreditCode'
        >
          <Input />
        </Form.Item>

        <Form.Item
          label='公司名称'
          name='name'
        >
          <Input placeholder='请输入公司名称' />
        </Form.Item>
        <Form.Item
          label='公司类型'
          name='type'
        >
          <Input placeholder='请输入公司类型' />
        </Form.Item>

        <Form.Item
          label='经营地址'
          name='address'
        >
          <Input placeholder='请输入经营地址' />
        </Form.Item>
        <Form.Item
          label='注册资本'
          name='registeredCapital'
        >
          <Input placeholder='请输入公司名称' />
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EnteredCompany;