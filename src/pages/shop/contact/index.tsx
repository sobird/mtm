/**
 * 联系方式
 *
 * @todo
 * mode 模式待实现
 *
 * sobird<i@sobird.me> at 2023/10/28 0:23:43 created.
 */

import React, { FC, PropsWithChildren } from 'react';
import classNames from 'classnames';
import { Form, Input, FormProps } from 'antd';
import { isEmail, isMobilePhone, isChineseName } from '@/utils/validator';
import FormItemCaptcha from '@/components/form-item-captcha';
import FieldCaptcha from '@/components/field-captcha';

import './index.scss';

const formItemLayout = {
  labelCol: {
    flex: '0 0 142px',
  },
  wrapperCol: {
    span: 12,
  },
};

interface ShopContactProps extends FormProps {
  mode?: 'create' | 'update' | 'detail';
}

const ShopContact: FC<PropsWithChildren<ShopContactProps>> = ({ className, form, children, mode, ...props }) => {
  const [_form] = Form.useForm();
  const formInstance = form || _form;

  return (
    <Form form={formInstance} className={classNames('admin-form', className)} {...formItemLayout} {...props}>
      <Form.Item
        label='联系邮箱'
        name='managerEmail'
        required
        rules={[
          {
            async validator(rule, value) {
              if (!isEmail(value)) {
                throw new Error('邮箱格式不合法');
              }
            },
          },
        ]}
      >
        <Input placeholder='请输入邮箱地址' />
      </Form.Item>

      <Form.Item label='客服电话' name='servicePhoneNum'>
        <Input placeholder='请您及时填写客服电话' />
      </Form.Item>

      <Form.Item
        label='紧急联系人姓名'
        name='emergencyContact'
        required
        rules={[
          {
            async validator(rule, value) {
              if (!isChineseName(value)) {
                throw new Error('请输入正确的中国人名');
              }
            },
          },
        ]}
      >
        <Input placeholder='请输入紧急联系人姓名' />
      </Form.Item>

      <Form.Item
        label='紧急联系人手机'
        name='emergencyContactPhone'
        required
        rules={[
          {
            async validator(rule, value) {
              if (!isMobilePhone(value)) {
                throw new Error('请输入正确的中国大陆11位手机号码');
              }
            },
          },
        ]}
      >
        <Input placeholder='请输入紧急联系人电话' />
      </Form.Item>
      <FormItemCaptcha mobile='emergencyContactPhone' />
      <Form.Item  label="验证码2">
        <FieldCaptcha phoneName="emergencyContactPhone"/>
      </Form.Item>
      {children}
    </Form>
  );
};

export default ShopContact;
