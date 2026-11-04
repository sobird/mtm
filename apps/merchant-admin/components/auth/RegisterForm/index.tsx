'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useFormState } from 'react-hook-form';

import { Button, Checkbox, Field, Form, Input, Select, useToast } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api-client';
import { translateApiError } from '@/lib/translate-api-error';
import { createInterCodeOptions, createRegisterSchema } from '@/lib/validation/auth';
import type { RegisterValues } from '@/lib/validation/auth';

import { CaptchaField } from '../CaptchaField';

import styles from './RegisterForm.module.css';

/** Reads submit state from the surrounding `FormProvider`. */
function RegisterSubmitButton() {
  const t = useTranslations('auth.register');
  const { isSubmitting } = useFormState();

  return (
    <Button type='submit' size='lg' loading={isSubmitting} className={styles.submit} data-testid='register-submit'>
      {t('submit')}
    </Button>
  );
}

export function RegisterForm() {
  const t = useTranslations('auth.register');
  const tLogin = useTranslations('auth.login');
  const tRoot = useTranslations();
  const router = useRouter();
  const toast = useToast();

  const schema = useMemo(() => createRegisterSchema(tRoot), [tRoot]);
  const interCodeOptions = useMemo(() => createInterCodeOptions(tRoot), [tRoot]);

  const handleSubmit = async (values: RegisterValues) => {
    try {
      await apiFetch('/api/register', {
        method: 'POST',
        body: { interCode: values.interCode, mobile: values.mobile, captcha: values.captcha },
      });

      router.push('/register/success');
    } catch (error) {
      // The backend reports an invalid captcha with a dedicated error code; the
      // legacy UI showed a generic "invalid code" message instead.
      if (error instanceof ApiError && error.code === 'INVALID_CAPTCHA') {
        toast.error(t('invalidCaptcha'));
        return;
      }

      toast.error(translateApiError(error, tRoot, 'auth.register.failed'));
    }
  };

  return (
    <Form
      schema={schema}
      defaultValues={{ interCode: '86', mobile: '', captcha: '' }}
      onSubmit={handleSubmit}
      className={styles.form}
    >
      <h1 className={styles.title}>{t('title')}</h1>

      <Field label={tLogin('interCode')} required>
        <Select name='interCode' options={interCodeOptions} aria-label={tLogin('interCode')} />
      </Field>

      <Field label={tLogin('mobile')} required>
        <Input
          name='mobile'
          placeholder={tLogin('mobilePlaceholder')}
          aria-label={tLogin('mobile')}
          autoComplete='tel-national'
          inputMode='numeric'
        />
      </Field>

      <CaptchaField />

      <Checkbox
        name='policy'
        className={styles.policy}
        label={
          <>
            {t('policyPrefix')}
            <span className={styles.policyName}>{t('policyName')}</span>
          </>
        }
      />

      <RegisterSubmitButton />

      <p className={styles.footer}>
        {t('hasAccount')}
        <Link href='/login'>{t('goToLogin')}</Link>
      </p>
    </Form>
  );
}

export default RegisterForm;
