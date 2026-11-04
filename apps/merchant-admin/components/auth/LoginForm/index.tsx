'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useFormState } from 'react-hook-form';

import { Button, Field, Form, Input, Select, Tabs, useToast } from '@/components/ui';
import { signInWithCredentials } from '@/lib/auth-client';
import { translateApiError } from '@/lib/translate-api-error';
import {
  createInterCodeOptions,
  createLoginSchema,
  createPasswordLoginSchema,
  safeCallbackUrl,
} from '@/lib/validation/auth';
import type { LoginValues, PasswordLoginValues } from '@/lib/validation/auth';

import { CaptchaField } from '../CaptchaField';

import styles from './LoginForm.module.css';

export interface LoginFormProps {
  callbackUrl?: string;
}

/** Reads submit state from the surrounding `FormProvider`. */
function LoginSubmitButton() {
  const t = useTranslations('auth.login');
  const { isSubmitting } = useFormState();

  return (
    <Button type='submit' size='lg' loading={isSubmitting} className={styles.submit} data-testid='login-submit'>
      {t('submit')}
    </Button>
  );
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const t = useTranslations('auth.login');
  const tRoot = useTranslations();
  const router = useRouter();
  const toast = useToast();

  const captchaSchema = useMemo(() => createLoginSchema(tRoot), [tRoot]);
  const passwordSchema = useMemo(() => createPasswordLoginSchema(tRoot), [tRoot]);
  const interCodeOptions = useMemo(() => createInterCodeOptions(tRoot), [tRoot]);

  const handleCaptchaSubmit = async (values: LoginValues) => {
    try {
      const result = await signInWithCredentials(
        'credentials',
        { interCode: values.interCode, mobile: values.mobile, captcha: values.captcha },
        safeCallbackUrl(callbackUrl)
      );

      if (result?.error) {
        toast.error(t('invalidCaptcha'));
        return;
      }

      router.replace(safeCallbackUrl(callbackUrl));
    } catch (error) {
      toast.error(translateApiError(error, tRoot, 'auth.login.failed'));
    }
  };

  const handlePasswordSubmit = async (values: PasswordLoginValues) => {
    try {
      const result = await signInWithCredentials(
        'password',
        { identifier: values.identifier, password: values.password },
        safeCallbackUrl(callbackUrl)
      );

      if (result?.error) {
        toast.error(t('invalidPassword'));
        return;
      }

      router.replace(safeCallbackUrl(callbackUrl));
    } catch (error) {
      toast.error(translateApiError(error, tRoot, 'auth.login.failed'));
    }
  };

  return (
    <div className={styles.form}>
      <h1 className={styles.title}>{t('title')}</h1>

      <Tabs
        items={[
          {
            key: 'captcha',
            label: t('captchaTab'),
            children: (
              <Form
                schema={captchaSchema}
                defaultValues={{ interCode: '86', mobile: '', captcha: '' }}
                onSubmit={handleCaptchaSubmit}
                className={styles.form}
              >
                <Field label={t('interCode')} required>
                  <Select name='interCode' options={interCodeOptions} aria-label={t('interCode')} />
                </Field>

                <Field label={t('mobile')} required>
                  <Input
                    name='mobile'
                    placeholder={t('mobilePlaceholder')}
                    aria-label={t('mobile')}
                    autoComplete='tel-national'
                    inputMode='numeric'
                  />
                </Field>

                <CaptchaField />

                <LoginSubmitButton />

                <p className={styles.footer}>
                  {t('noAccount')}
                  <Link href='/register'>{t('registerLink')}</Link>
                </p>
              </Form>
            ),
          },
          {
            key: 'password',
            label: t('passwordTab'),
            children: (
              <Form
                schema={passwordSchema}
                defaultValues={{ identifier: '', password: '' }}
                onSubmit={handlePasswordSubmit}
                className={styles.form}
              >
                <Field label={t('identifier')} required>
                  <Input
                    name='identifier'
                    placeholder={t('identifierPlaceholder')}
                    aria-label={t('identifier')}
                    autoComplete='username'
                  />
                </Field>

                <Field label={t('password')} required>
                  <Input
                    name='password'
                    type='password'
                    placeholder={t('passwordPlaceholder')}
                    aria-label={t('password')}
                    autoComplete='current-password'
                  />
                </Field>

                <LoginSubmitButton />
              </Form>
            ),
          },
        ]}
      />
    </div>
  );
}

export default LoginForm;
