'use client';

import { useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';

import { Button, Field, Input, useToast } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api-client';
import { isMobilePhone } from '@/lib/validation/phone';

import styles from './CaptchaField.module.css';

const COUNTDOWN_SECONDS = 60;

interface CaptchaResponse {
  mobile: number;
  captcha: number;
}

/**
 * Captcha input plus a 获取验证码 button. Must be rendered inside a `Form`: the
 * input registers as `captcha`, while the button reads `mobile` and `interCode`
 * from the surrounding form context.
 */
export function CaptchaField() {
  const toast = useToast();
  const mobile = String(useWatch({ name: 'mobile' }) ?? '');
  const interCode = String(useWatch({ name: 'interCode' }) ?? '86');
  const [remaining, setRemaining] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (remaining <= 0) {
      return;
    }

    const timer = setTimeout(() => setRemaining(value => value - 1), 1000);

    return () => clearTimeout(timer);
  }, [remaining]);

  const handleSend = async () => {
    if (remaining > 0 || sending) {
      return;
    }

    if (!isMobilePhone(mobile, interCode)) {
      toast.error('手机号格式不符合要求');
      return;
    }

    setSending(true);

    try {
      const { captcha } = await apiFetch<CaptchaResponse>('/api/captcha', { query: { mobile } });

      toast.success(
        `【开源电商】${captcha}（商户注册验证码）。工作人员不会向您索要，请勿向任何人泄露，以免造成账户或资金损失。`
      );
      setRemaining(COUNTDOWN_SECONDS);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : '获取验证码失败');
    } finally {
      setSending(false);
    }
  };

  return (
    <Field label='验证码' required>
      <div className={styles.row}>
        <div className={styles.input}>
          <Input name='captcha' placeholder='请输入验证码' aria-label='验证码' autoComplete='one-time-code' />
        </div>
        <Button
          type='button'
          variant='secondary'
          className={styles.button}
          disabled={remaining > 0 || sending}
          onClick={handleSend}
        >
          {remaining > 0 ? `${remaining} 秒后重新获取` : '获取验证码'}
        </Button>
      </div>
    </Field>
  );
}

export default CaptchaField;
