'use client';

import { useFormState } from 'react-hook-form';

import { Button, Field, Form, Input, useToast } from '@/components/ui';
import { contactSchema } from '@/lib/validation/profile';

import styles from './ContactForm.module.css';

export interface ContactFormProps {
  defaultEmail?: string;
  defaultServicePhone?: string;
}

function ContactSubmitButton() {
  const { isSubmitting } = useFormState();

  return (
    <div className={styles.actions}>
      <Button type='submit' loading={isSubmitting}>
        更新联系方式
      </Button>
    </div>
  );
}

export function ContactForm({ defaultEmail = '', defaultServicePhone = '' }: ContactFormProps) {
  const toast = useToast();

  return (
    <Form
      schema={contactSchema}
      defaultValues={{
        managerEmail: defaultEmail,
        servicePhoneNum: defaultServicePhone,
        emergencyContact: '',
        emergencyContactPhone: '',
        captcha: '',
      }}
      onSubmit={() => {
        toast.success('联系方式已更新');
      }}
      className={styles.form}
    >
      <Field label='联系邮箱' required>
        <Input name='managerEmail' placeholder='请输入邮箱地址' aria-label='联系邮箱' />
      </Field>

      <Field label='客服电话' hint='最多30个字符'>
        <Input name='servicePhoneNum' placeholder='请您及时填写客服电话' aria-label='客服电话' />
      </Field>

      <Field label='紧急联系人姓名' required>
        <Input name='emergencyContact' placeholder='请输入紧急联系人姓名' aria-label='紧急联系人姓名' />
      </Field>

      <Field label='紧急联系人手机' required>
        <Input
          name='emergencyContactPhone'
          placeholder='请输入紧急联系人电话'
          inputMode='numeric'
          aria-label='紧急联系人手机'
        />
      </Field>

      <Field label='验证码' required>
        <Input name='captcha' placeholder='请查看手机短信，输入验证码' inputMode='numeric' aria-label='验证码' />
      </Field>

      <ContactSubmitButton />
    </Form>
  );
}

export default ContactForm;
