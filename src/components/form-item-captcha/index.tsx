/**
 * 手机验证码表单组件 带服务
 *
 * @see https://github.com/ant-design/pro-components/blob/master/packages/form/src/components/Captcha/index.tsx
 *
 * sobird<i@sobird.me> at 2023/10/28 1:33:42 created.
 */

import { FC } from 'react';
import { Form, FormItemProps } from 'antd';
import { isSmsCode } from '@/utils/validator';
import CommonService from '@/services/common';
import FieldCaptcha, { FieldCaptchaProps } from '@/components/field-captcha';

interface FormItemCaptchaProps extends FormItemProps {
  /** 手机号的字段 name */
  phoneName?: string | number;
  placeholder?: string;
  onCaptcha?: FieldCaptchaProps['onCaptcha'];
  fieldProps?: FieldCaptchaProps['fieldProps'];
}

const FormItemCaptcha: FC<FormItemCaptchaProps> = ({
  phoneName = 'mobile',
  placeholder,
  onCaptcha = (async mobile => {
    await CommonService.captcha(mobile);
  }),
  fieldProps,
  ...props
}) => {
  return (
    <Form.Item
      label="验证码"
      name="captcha"
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
        phoneName={phoneName}
        buttonProps={{
          style: { padding: 0 },
        }}
        fieldProps={{
          placeholder,
          ...fieldProps,
        }}
        // captchaTextRender={
        //   (paramsTiming, paramsCount) => {
        //     return paramsTiming ? `${paramsCount} 秒后重新获取` : '获取验证码';
        //   }
        // }
        // 如果需要失败可以 throw 一个错误出来，onGetCaptcha 会自动停止
        // throw new Error("获取验证码错误")
        onCaptcha={onCaptcha}
      />
    </Form.Item>
  );
};

export default FormItemCaptcha;
