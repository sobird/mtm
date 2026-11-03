'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormState } from 'react-hook-form';

import { Button, Checkbox, Field, Form, Input, Select, useToast } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api-client';
import { INTER_CODE_OPTIONS, registerSchema } from '@/lib/validation/auth';
import type { RegisterValues } from '@/lib/validation/auth';

import { CaptchaField } from '../CaptchaField';

import styles from './RegisterForm.module.css';

const POLICY_URL = 'https://page.meituan.net/html/1615180237352_38ceb3/index.html';

/** Reads submit state from the surrounding `FormProvider`. */
function RegisterSubmitButton() {
  const { isSubmitting } = useFormState();

  return (
    <Button type='submit' size='lg' loading={isSubmitting} className={styles.submit}>
      注册
    </Button>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (values: RegisterValues) => {
    try {
      await apiFetch('/api/register', {
        method: 'POST',
        body: { interCode: values.interCode, mobile: values.mobile, captcha: values.captcha },
      });

      router.push('/register/success');
    } catch (error) {
      // The backend reports `验证码不正确`; the legacy UI showed `验证码错误`.
      if (error instanceof ApiError && error.code === 'INVALID_CAPTCHA') {
        toast.error('验证码错误');
        return;
      }

      toast.error(error instanceof Error ? error.message : '注册失败');
    }
  };

  return (
    <Form
      schema={registerSchema}
      defaultValues={{ interCode: '86', mobile: '', captcha: '' }}
      onSubmit={handleSubmit}
      className={styles.form}
    >
      <h1 className={styles.title}>注册</h1>

      <Field label='区号' required>
        <Select name='interCode' options={INTER_CODE_OPTIONS} aria-label='区号' />
      </Field>

      <Field label='手机号' required>
        <Input name='mobile' placeholder='请输入手机号' autoComplete='tel-national' inputMode='numeric' />
      </Field>

      <CaptchaField />

      <Checkbox
        name='policy'
        className={styles.policy}
        label={
          <>
            我已阅读并同意
            <a href={POLICY_URL} target='_blank' rel='noreferrer' onClick={event => event.stopPropagation()}>
              《团好货商家版隐私政策》
            </a>
          </>
        }
      />

      <RegisterSubmitButton />

      <p className={styles.footer}>
        已有账号，<Link href='/login'>去登录</Link>
      </p>
    </Form>
  );
}

export default RegisterForm;
