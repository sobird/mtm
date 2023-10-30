/**
 * 手机验证码表单组件 带服务
 *
 * @see https://github.com/ant-design/pro-components/blob/master/packages/form/src/components/Captcha/index.tsx
 *
 * sobird<i@sobird.me> at 2023/10/28 1:33:42 created.
 */

import React, { FC } from 'react';
import { Form, FormItemProps } from 'antd';
import { isSmsCode } from '@/utils/validator';
import CommonService from '@/services/common';
import FieldCaptcha from '@/components/field-captcha';

interface FormItemCaptchaProps extends FormItemProps {
  /** 手机号的字段 name */
  mobile?: string | number;
  placeholder?: string;
}

const FormItemCaptcha: FC<FormItemCaptchaProps> = ({ mobile = 'mobile', placeholder, ...props }) => {
  return (
    <Form.Item
      label='验证码'
      name='captcha'
      required
      rules={[
        {
          validator(rule, value) {
            if (!isSmsCode(value)) {
              throw new Error('手机验证码不正确，请重新输入');
            }
          },
        },
      ]}
      {...props}
    >
      <FieldCaptcha
        // 手机号的 name，onCaptcha 会注入这个值
        phoneName={mobile}
        buttonProps={{
          size: 'small',
          type: 'link',
          style: { padding: 0 },
        }}
        fieldProps={{
          placeholder: placeholder || '请查看手机短信，输入验证码',
        }}
        // captchaTextRender={
        //   (paramsTiming, paramsCount) => {
        //     return paramsTiming ? `${paramsCount} 秒后重新获取` : '获取验证码';
        //   }
        // }

        // 如果需要失败可以 throw 一个错误出来，onGetCaptcha 会自动停止
        // throw new Error("获取验证码错误")
        onCaptcha={async mobile => {
          await CommonService.captcha(mobile);
        }}
      />
    </Form.Item>
  );
};

export default FormItemCaptcha;
