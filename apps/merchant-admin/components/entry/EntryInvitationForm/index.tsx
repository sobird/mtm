'use client';

import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFormState } from 'react-hook-form';
import { z } from 'zod';

import { Button, Field, Form, Input, useToast } from '@/components/ui';
import { ApiError, apiFetch } from '@/lib/api-client';

import styles from './EntryInvitationForm.module.css';

const invitationSchema = z.object({
  code: z.string().optional(),
});

type InvitationValues = z.infer<typeof invitationSchema>;

function InvitationSubmit() {
  const { isSubmitting } = useFormState();

  return (
    <div className={styles.actions}>
      <Button type='submit' size='lg' loading={isSubmitting}>
        立即入住
        <ChevronRight size={14} aria-hidden='true' />
      </Button>
    </div>
  );
}

export function EntryInvitationForm() {
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (values: InvitationValues) => {
    try {
      await apiFetch<null>('/api/invitation', {
        method: 'POST',
        body: { code: values.code ?? '' },
      });
      router.push('/settleinjx/shop');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : '提交失败，请稍后重试');
    }
  };

  return (
    <div className={styles.wrapper}>
      <Form schema={invitationSchema} defaultValues={{ code: '' }} onSubmit={handleSubmit} className={styles.form}>
        <Field label='邀请码'>
          <Input name='code' placeholder='邀请码非必填，如有请填写服务商招商码或推荐商家邀请码' aria-label='邀请码' />
        </Field>
        <InvitationSubmit />
      </Form>
    </div>
  );
}

export default EntryInvitationForm;
