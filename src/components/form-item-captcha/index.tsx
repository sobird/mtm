/**
 * 手机验证码表单组件 带服务
 *
 * sobird<i@sobird.me> at 2023/10/28 1:33:42 created.
 */

import React, { FC, ComponentProps } from 'react';
import { ProFormCaptcha } from '@ant-design/pro-components';
import { isSmsCode } from '@/utils/validator';
import CommonService from '@/services/common';

interface FormItemCaptchaProps extends Omit<ComponentProps<typeof ProFormCaptcha>, "onGetCaptcha">{
  /** 手机号的字段 name */
  mobile?: string | number;
}

const FormItemCaptcha: FC<FormItemCaptchaProps> = ({ mobile = "mobile", ...props }) => {
  return (
    <ProFormCaptcha
      label='验证码'
      name='captcha'
      // 手机号的 name，onGetCaptcha 会注入这个值
      phoneName={mobile}
      fieldProps={
        {
          //
        }
      }
      captchaProps={{
        size: 'small',
        type: 'link',
        style: { padding: 0 },
      }}
      placeholder='请查看手机短信，输入验证码'
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
      // captchaTextRender={
      //   (paramsTiming, paramsCount) => {
      //     return paramsTiming ? `${paramsCount} 秒后重新获取` : '获取验证码';
      //   }
      // }

      // 如果需要失败可以 throw 一个错误出来，onGetCaptcha 会自动停止
      // throw new Error("获取验证码错误")
      onGetCaptcha={async mobile => {
        await CommonService.captcha(mobile);
      }}
      {...props}
    />
  );
};

export default FormItemCaptcha;
