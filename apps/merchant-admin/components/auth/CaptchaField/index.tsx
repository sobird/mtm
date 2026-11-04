'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';

import { Button, Field, Input, useToast } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { translateApiError } from '@/lib/translate-api-error';
import { isMobilePhone } from '@/lib/validation/phone';

import styles from './CaptchaField.module.css';

const COUNTDOWN_SECONDS = 60;

interface CaptchaResponse {
  mobile: number;
  captcha: number;
}

/**
 * Captcha input plus a get-code button. Must be rendered inside a `Form`: the
 * input registers as `captcha`, while the button reads `mobile` and `interCode`
 * from the surrounding form context.
 */
export function CaptchaField() {
  const t = useTranslations('auth.login');
  const tRoot = useTranslations();
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
      toast.error(t('invalidMobileFormat'));
      return;
    }

    setSending(true);

    try {
      const { captcha } = await apiFetch<CaptchaResponse>('/api/captcha', { query: { mobile } });

      toast.success(t('captchaSent', { captcha: String(captcha) }));
      setRemaining(COUNTDOWN_SECONDS);
    } catch (error) {
      toast.error(translateApiError(error, tRoot, 'auth.login.captchaSendFailed'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Field label={t('captcha')} required>
      <div className={styles.row}>
        <div className={styles.input}>
          <Input
            name='captcha'
            placeholder={t('captchaPlaceholder')}
            aria-label={t('captcha')}
            autoComplete='one-time-code'
          />
        </div>
        <Button
          type='button'
          variant='secondary'
          className={styles.button}
          disabled={remaining > 0 || sending}
          onClick={handleSend}
        >
          {remaining > 0 ? t('resendIn', { seconds: remaining }) : t('sendCaptcha')}
        </Button>
      </div>
    </Field>
  );
}

export default CaptchaField;
