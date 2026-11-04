'use client';

import { useTranslations } from 'next-intl';
import { useFormContext, useFormState } from 'react-hook-form';

import FieldCaptcha from '@/components/admin/FieldCaptcha';
import FieldIdCard from '@/components/admin/FieldIdCard';
import FieldTermPicker from '@/components/admin/FieldTermPicker';
import FieldUploadFile from '@/components/admin/FieldUploadFile';
import { Button, Field, Form, Input, useToast } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import type { VenusOcrResult } from '@/lib/services/venus';
import { translateApiError } from '@/lib/translate-api-error';
import { createAdminSchema } from '@/lib/validation/admin';

import styles from './AdminForm.module.css';

function normalizeValiddate(value: unknown): [boolean, string, string] {
  if (!Array.isArray(value)) {
    return [false, '', ''];
  }

  return [Boolean(value[0]), value[1] ? String(value[1]) : '', value[2] ? String(value[2]) : ''];
}

function AdminSubmitButton({ label }: { label: string }) {
  const { isSubmitting } = useFormState();

  return (
    <div className={styles.actions}>
      <Button type='submit' loading={isSubmitting}>
        {label}
      </Button>
    </div>
  );
}

function AdminFields() {
  const toast = useToast();
  const t = useTranslations('shop.admin');
  const tRoot = useTranslations();
  const { setValue } = useFormContext();

  const handleIdCardUpload = async (res: { url: string }, index: number) => {
    if (index !== 0) {
      return;
    }

    try {
      // 身份证人像面才识别
      const info = await apiFetch<VenusOcrResult>('/api/venus/ocr', {
        method: 'POST',
        body: { image: res.url, type: 0 },
      });

      setValue('name', info.name ?? '', { shouldValidate: true });
      setValue('citizenId', info.citizenId ?? '', { shouldValidate: true });
      setValue('validdate', normalizeValiddate(info.validdate), { shouldValidate: true });
    } catch (error) {
      toast.error(translateApiError(error, tRoot, 'shop.admin.ocrFailed'));
    }
  };

  return (
    <>
      <Field label={t('cardType')}>
        <p className={styles.staticValue}>
          {t('cardTypeValue')}
          <span className={styles.muted}>{t('cardTypeHint')}</span>
        </p>
      </Field>

      <Field label={t('idCardPhotos')} required>
        <FieldIdCard name='idCardPhotos' onUploadSuccess={handleIdCardUpload} />
      </Field>

      <Field label={t('name')} required>
        <Input name='name' placeholder={t('namePlaceholder')} aria-label={t('name')} />
      </Field>

      <Field label={t('citizenId')} required>
        <Input name='citizenId' placeholder={t('citizenIdPlaceholder')} aria-label={t('citizenId')} />
      </Field>

      <Field label={t('validUntil')} required>
        <FieldTermPicker name='validdate' />
      </Field>

      <Field label={t('mobile')} required>
        <Input name='mobile' placeholder={t('mobilePlaceholder')} inputMode='numeric' aria-label={t('mobile')} />
      </Field>

      <Field label={t('captcha')} required>
        <FieldCaptcha name='captcha' phoneName='mobile' placeholder={t('captchaPlaceholder')} />
      </Field>

      <Field label={t('authLetter')} required>
        <FieldUploadFile name='authLetter' maxCount={1} accept='.jpg,.jpeg,.png,.gif,.bmp' maxSizeMB={10} />
        <ul className={styles.uploadNotes}>
          <li>{t('note1')}</li>
          <li>{t('note2')}</li>
          <li>{t('note3')}</li>
          <li>{t('note4')}</li>
        </ul>
      </Field>

      <AdminSubmitButton label={t('submit')} />
    </>
  );
}

export function AdminForm() {
  const toast = useToast();
  const t = useTranslations('shop.admin');
  const tRoot = useTranslations();
  const adminSchema = createAdminSchema(tRoot);

  const handleSubmit = () => {
    toast.success(t('saved'));
  };

  return (
    <Form
      schema={adminSchema}
      defaultValues={{
        idCardPhotos: [],
        name: '',
        citizenId: '',
        validdate: [false],
        mobile: '',
        captcha: '',
        authLetter: [],
      }}
      onSubmit={handleSubmit}
      className={styles.form}
    >
      <AdminFields />
    </Form>
  );
}

export default AdminForm;
