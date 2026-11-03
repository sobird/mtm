'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormState } from 'react-hook-form';

import { Button, Field, Form, Input, Select, useToast } from '@/components/ui';
import { INTER_CODE_OPTIONS, loginSchema, safeCallbackUrl } from '@/lib/validation/auth';
import type { LoginValues } from '@/lib/validation/auth';

import { CaptchaField } from '../CaptchaField';

import styles from './LoginForm.module.css';

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
    const result = await signIn('credentials', {
      interCode: values.interCode,
      mobile: values.mobile,
      captcha: values.captcha,
      redirect: false,
    });

    if (result?.error) {
      toast.error('手机号或验证码错误');
      return;
    }

    router.replace(safeCallbackUrl(callbackUrl));
  };

  return (
    <Form
      schema={loginSchema}
      defaultValues={{ interCode: '86', mobile: '', captcha: '' }}
      onSubmit={handleSubmit}
      className={styles.form}
    >
      <h1 className={styles.title}>登录</h1>

      <Field label='区号' required>
        <Select name='interCode' options={INTER_CODE_OPTIONS} aria-label='区号' />
      </Field>

      <Field label='手机号' required>
        <Input name='mobile' placeholder='请输入手机号' autoComplete='tel-national' inputMode='numeric' />
      </Field>

      <CaptchaField />

      <LoginSubmitButton />

      <p className={styles.footer}>
        还没有账号？<Link href='/register'>免费注册</Link>
      </p>
    </Form>
  );
}

export default LoginForm;
