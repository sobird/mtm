'use client';

import { useEffect, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import { Button, Input, useToast } from '@/components/ui';
import { ApiError, apiFetch } from '@/lib/api-client';
import { isMobilePhone } from '@/lib/validation/phone';

import styles from './FieldCaptcha.module.css';

export interface FieldCaptchaProps {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  /** Static phone number used when the code is not read from a form field. */
  mobile?: string;
  /** Form field containing the phone number. */
  phoneName?: string;
  countDown?: number;
  onCaptcha?: (mobile: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

interface ViewProps extends Omit<FieldCaptchaProps, 'name' | 'value' | 'onChange' | 'phoneName' | 'mobile'> {
  value: string;
  onChange: (value: string) => void;
  mobile: string;
}

function FieldCaptchaView({
  value,
  onChange,
  mobile,
  countDown = 60,
  onCaptcha,
  placeholder,
  disabled,
  error,
}: ViewProps) {
  const toast = useToast();
  const [remaining, setRemaining] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (remaining <= 0) {
      return;
    }

    const timer = setTimeout(() => setRemaining(count => count - 1), 1000);

    return () => clearTimeout(timer);
  }, [remaining]);

  const handleSend = async () => {
    if (remaining > 0 || sending || disabled) {
      return;
    }

    if (!isMobilePhone(mobile, '86')) {
      toast.error('手机号格式不符合要求');
      return;
    }

    setSending(true);

    try {
      if (onCaptcha) {
        await onCaptcha(mobile);
      } else {
        const { captcha } = await apiFetch<{ mobile: number; captcha: number }>('/api/captcha', {
          query: { mobile },
        });

        toast.success(
          `【美团】${captcha}（商户注册验证码）。工作人员不会向您索要，请勿向任何人泄露，以免造成账户或资金损失。`
        );
      }

      setRemaining(countDown);
    } catch (sendError) {
      toast.error(sendError instanceof ApiError ? sendError.message : '获取验证码失败');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.captcha}>
      <div className={styles.row}>
        <Input
          className={styles.input}
          value={value}
          placeholder={placeholder ?? '请输入验证码'}
          aria-label='验证码'
          autoComplete='one-time-code'
          inputMode='numeric'
          disabled={disabled}
          onChange={event => onChange(event.target.value)}
        />
        <Button
          type='button'
          variant='secondary'
          size='sm'
          className={styles.button}
          disabled={disabled || remaining > 0 || sending}
          onClick={handleSend}
        >
          {remaining > 0 ? `${remaining} 秒后重新获取` : '获取验证码'}
        </Button>
      </div>
      {error ? (
        <p role='alert' className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface BoundProps extends FieldCaptchaProps {
  name: string;
  control: ReturnType<typeof useFormContext>['control'];
}

function FieldCaptchaBound({ name, control, phoneName, mobile, ...rest }: BoundProps) {
  const watchedMobile = useWatch({ control, name: phoneName ?? '__field_captcha_mobile' });

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FieldCaptchaView
          {...rest}
          value={typeof field.value === 'string' ? field.value : ''}
          onChange={field.onChange}
          mobile={mobile ?? (watchedMobile === undefined || watchedMobile === null ? '' : String(watchedMobile))}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export function FieldCaptcha(props: FieldCaptchaProps) {
  const methods = useFormContext();

  if (methods?.control && props.name) {
    return <FieldCaptchaBound {...props} name={props.name} control={methods.control} />;
  }

  return (
    <FieldCaptchaView
      {...props}
      value={props.value ?? ''}
      onChange={next => props.onChange?.(next)}
      mobile={props.mobile ?? ''}
    />
  );
}

export default FieldCaptcha;
