'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormState } from 'react-hook-form';

import { Button, Field, Form, Input, Select, Tabs, useToast } from '@/components/ui';
import { INTER_CODE_OPTIONS, loginSchema, passwordLoginSchema, safeCallbackUrl } from '@/lib/validation/auth';
import type { LoginValues, PasswordLoginValues } from '@/lib/validation/auth';

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

  const handleCaptchaSubmit = async (values: LoginValues) => {
    try {
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
    } catch {
      toast.error('登录失败，请稍后重试');
    }
  };

  const handlePasswordSubmit = async (values: PasswordLoginValues) => {
    try {
      const result = await signIn('password', {
        identifier: values.identifier,
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
    <div className={styles.form}>
      <h1 className={styles.title}>登录</h1>

      <Tabs
        items={[
          {
            key: 'captcha',
            label: '手机验证码登录',
            children: (
              <Form
                schema={loginSchema}
                defaultValues={{ interCode: '86', mobile: '', captcha: '' }}
                onSubmit={handleCaptchaSubmit}
                className={styles.form}
              >
                <Field label='区号' required>
                  <Select name='interCode' options={INTER_CODE_OPTIONS} aria-label='区号' />
                </Field>

                <Field label='手机号' required>
                  <Input
                    name='mobile'
                    placeholder='请输入手机号'
                    aria-label='手机号'
                    autoComplete='tel-national'
                    inputMode='numeric'
                  />
                </Field>

                <CaptchaField />

                <LoginSubmitButton />

                <p className={styles.footer}>
                  还没有账号？<Link href='/register'>免费注册</Link>
                </p>
              </Form>
            ),
          },
          {
            key: 'password',
            label: '账号密码登录',
            children: (
              <Form
                schema={passwordLoginSchema}
                defaultValues={{ identifier: '', password: '' }}
                onSubmit={handlePasswordSubmit}
                className={styles.form}
              >
                <Field label='用户名或手机号' required>
                  <Input
                    name='identifier'
                    placeholder='请输入用户名或手机号'
                    aria-label='用户名或手机号'
                    autoComplete='username'
                  />
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
            ),
          },
        ]}
      />
    </div>
  );
}

export default LoginForm;
