'use client';

import { Button, Field, Form, Input, useToast } from '@mtm/ui';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useFormState } from 'react-hook-form';

import { loginSchema, safeCallbackUrl } from '@/lib/validation/auth';
import type { LoginValues } from '@/lib/validation/auth';

import styles from './index.module.css';

export interface LoginFormProps {
  callbackUrl?: string;
}

/** Reads submit state from the surrounding `FormProvider`. */
function LoginSubmitButton() {
  const { isSubmitting } = useFormState();

  return (
    <Button type='submit' size='lg' loading={isSubmitting} className={styles.submit}>
      登录
    </Button>
  );
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (values: LoginValues) => {
    try {
      const result = await signIn('credentials', {
        username: values.username,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('用户名或密码错误');
        return;
      }

      router.replace(safeCallbackUrl(callbackUrl));
    } catch {
      toast.error('登录失败，请稍后重试');
    }
  };

  return (
    <Form
      schema={loginSchema}
      defaultValues={{ username: '', password: '' }}
      onSubmit={handleSubmit}
      className={styles.form}
    >
      <h1 className={styles.title}>运营后台登录</h1>

      <Field label='用户名' required>
        <Input name='username' placeholder='请输入用户名' aria-label='用户名' autoComplete='username' />
      </Field>

      <Field label='密码' required>
        <Input
          name='password'
          type='password'
          placeholder='请输入密码'
          aria-label='密码'
          autoComplete='current-password'
        />
      </Field>

      <LoginSubmitButton />
    </Form>
  );
}

export default LoginForm;
