'use client';

import { useTranslations } from 'next-intl';
import { useFormState } from 'react-hook-form';

import { Button, Field, Form, Input, useToast } from '@/components/ui';
import { createContactSchema } from '@/lib/validation/profile';

import styles from './ContactForm.module.css';

export interface ContactFormProps {
  defaultEmail?: string;
  defaultServicePhone?: string;
}

function ContactSubmitButton({ label }: { label: string }) {
  const { isSubmitting } = useFormState();

  return (
    <div className={styles.actions}>
      <Button type='submit' loading={isSubmitting}>
        {label}
      </Button>
    </div>
  );
}

export function ContactForm({ defaultEmail = '', defaultServicePhone = '' }: ContactFormProps) {
  const toast = useToast();
  const t = useTranslations('shop.contactForm');
  const tRoot = useTranslations();
  const contactSchema = createContactSchema(tRoot);

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
        toast.success(t('saved'));
      }}
      className={styles.form}
    >
      <Field label={t('email')} required>
        <Input name='managerEmail' placeholder={t('emailPlaceholder')} aria-label={t('email')} />
      </Field>

      <Field label={t('servicePhone')} hint={t('servicePhoneHint')}>
        <Input name='servicePhoneNum' placeholder={t('servicePhonePlaceholder')} aria-label={t('servicePhone')} />
      </Field>

      <Field label={t('contactName')} required>
        <Input name='emergencyContact' placeholder={t('contactNamePlaceholder')} aria-label={t('contactName')} />
      </Field>

      <Field label={t('contactPhone')} required>
        <Input
          name='emergencyContactPhone'
          placeholder={t('contactPhonePlaceholder')}
          inputMode='numeric'
          aria-label={t('contactPhone')}
        />
      </Field>

      <Field label={t('captcha')} required>
        <Input name='captcha' placeholder={t('captchaPlaceholder')} inputMode='numeric' aria-label={t('captcha')} />
      </Field>

      <ContactSubmitButton label={t('title')} />
    </Form>
  );
}

export default ContactForm;
