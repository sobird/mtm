/**
 * 验证码表单输入字段
 * 
 * sobird<i@sobird.me> at 2023/10/29 18:20:51 created.
 */

import React, { useEffect, useState } from 'react';
import { Button, Form, Input, ButtonProps, InputProps } from 'antd';
import type { NamePath,  } from 'antd/lib/form/interface';
import useInterval from '@/hooks/useInterval';


export type FieldCaptchaProps =  {
  value?: InputProps['value'];
  onChange?: InputProps['onChange'];

  /** 倒计时的秒数 */
  countDown?: number;
  /** 手机号的 name */
  phoneName?: NamePath;
  /** 获取验证码的方法 */
  onCaptcha: (mobile: string) => Promise<void>;
  /** 渲染按钮的文字 */
  buttonTextRender?: (count: number) => React.ReactNode;
  /** 获取验证码按钮的props */
  buttonProps?: ButtonProps;
};

const FieldCaptcha: React.FC<FieldCaptchaProps> = ({
  countDown,
  phoneName,
  onCaptcha,
  buttonTextRender = (count) => {
    return count ? `${count} 秒后重新获取` : '获取验证码';
  },
  buttonProps,
}) => {
  const form = Form.useFormInstance();
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>();
  const [clearInterval, startInterval] = useInterval(() => {
    setCount((count) => {
      if (count <= 1) {
        clearInterval();
      }
      return count - 1;
    });
  }, null);

  const onGetCaptcha = async (mobile: string) => {
    try {
      setLoading(true);
      await onCaptcha(mobile);
      setLoading(false);

      setCount(countDown || 60);
      startInterval(1000);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  return (
    <div
      style={{
        // ...fieldProps?.style,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Input
        // {...fieldProps}
        style={{
          flex: 1,
          transition: 'width .3s',
          marginRight: 8,
        }}
      />
      <Button
        style={{
          display: 'block',
        }}
        disabled={count > 0}
        loading={loading}
        {...buttonProps}
        onClick={async () => {
          try {
            if (phoneName) {
              await form.validateFields([phoneName].flat(1) as string[]);
              const mobile = form.getFieldValue(
                [phoneName].flat(1) as string[],
              );
              await onGetCaptcha(mobile);
            } else {
              await onGetCaptcha('');
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.log(error);
          }
        }}
      >
        {buttonTextRender(count)}
      </Button>
    </div>
  );
};

export default FieldCaptcha;
