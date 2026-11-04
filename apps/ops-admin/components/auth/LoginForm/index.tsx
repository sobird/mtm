'use client';

import { Button, Field, Form, Input, useToast } from '@mtm/ui';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useFormState } from 'react-hook-form';

import { signInWithCredentials } from '@/lib/auth-client';
import { translateApiError } from '@/lib/translate-api-error';
import { createLoginSchema, safeCallbackUrl } from '@/lib/validation/auth';
import type { LoginValues } from '@/lib/validation/auth';

import styles from './index.module.css';

export interface LoginFormProps {
  callbackUrl?: string;
}

/** Reads submit state from the surrounding `FormProvider`. */
function LoginSubmitButton() {
  const t = useTranslations('auth.opsLogin');
  const { isSubmitting } = useFormState();

  return (
    <Button type='submit' size='lg' loading={isSubmitting} className={styles.submit} data-testid='login-submit'>
      {t('submit')}
    </Button>
  );
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const t = useTranslations('auth.opsLogin');
  const tRoot = useTranslations();
  const router = useRouter();
  const toast = useToast();

  const loginSchema = useMemo(() => createLoginSchema(tRoot), [tRoot]);

  const handleSubmit = async (values: LoginValues) => {
    try {
      const result = await signInWithCredentials(
        'credentials',
        { username: values.username, password: values.password },
        safeCallbackUrl(callbackUrl)
      );

      if (result?.error) {
        toast.error(t('invalidCredentials'));
        return;
      }

      router.replace(safeCallbackUrl(callbackUrl));
    } catch (error) {
      toast.error(translateApiError(error, tRoot, 'auth.opsLogin.failed'));
    }
  };

  return (
    <Form
      schema={loginSchema}
      defaultValues={{ username: '', password: '' }}
      onSubmit={handleSubmit}
      className={styles.form}
    >
      <h1 className={styles.title}>{t('title')}</h1>

      <Field label={t('username')} required>
        <Input
          name='username'
          placeholder={t('usernamePlaceholder')}
          aria-label={t('username')}
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
  );
}

export default LoginForm;
