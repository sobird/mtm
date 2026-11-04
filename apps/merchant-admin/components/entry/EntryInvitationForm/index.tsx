'use client';

import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useFormState } from 'react-hook-form';
import { z } from 'zod';

import { Button, Field, Form, Input, useToast } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { translateApiError } from '@/lib/translate-api-error';

import styles from './EntryInvitationForm.module.css';

const invitationSchema = z.object({
  code: z.string().optional(),
});

type InvitationValues = z.infer<typeof invitationSchema>;

function InvitationSubmit() {
  const t = useTranslations('entry.invitation');
  const { isSubmitting } = useFormState();

  return (
    <div className={styles.actions}>
      <Button type='submit' size='lg' loading={isSubmitting}>
        {t('submit')}
        <ChevronRight size={14} aria-hidden='true' />
      </Button>
    </div>
  );
}

export function EntryInvitationForm() {
  const t = useTranslations('entry.invitation');
  const tRoot = useTranslations();
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
      toast.error(translateApiError(error, tRoot, 'entry.invitation.failed'));
    }
  };

  return (
    <div className={styles.wrapper}>
      <Form schema={invitationSchema} defaultValues={{ code: '' }} onSubmit={handleSubmit} className={styles.form}>
        <Field label={t('code')}>
          <Input name='code' placeholder={t('codePlaceholder')} aria-label={t('code')} />
        </Field>
        <InvitationSubmit />
      </Form>
    </div>
  );
}

export default EntryInvitationForm;
