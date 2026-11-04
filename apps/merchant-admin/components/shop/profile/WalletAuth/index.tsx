'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button, Dialog, Field, Form, Input, Steps, useToast } from '@/components/ui';
import { createWalletAuthSchema } from '@/lib/validation/profile';

import styles from './WalletAuth.module.css';

export interface WalletAuthProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FORM_ID = 'wallet-auth-form';

export function WalletAuth({ open, onOpenChange }: WalletAuthProps) {
  const toast = useToast();
  const t = useTranslations('shop.wallet.auth');
  const tCommon = useTranslations('common');
  const tRoot = useTranslations();
  const walletAuthSchema = createWalletAuthSchema(tRoot);
  const [step, setStep] = useState(0);

  const stepItems = [
    { key: 'admin', title: t('stepAdmin') },
    { key: 'confirm', title: t('stepConfirm') },
  ];

  useEffect(() => {
    if (!open) {
      setStep(0);
    }
  }, [open]);

  const footer =
    step === 0 ? (
      <>
        <Button variant='secondary' onClick={() => onOpenChange(false)}>
          {tCommon('cancel')}
        </Button>
        <Button type='submit' form={FORM_ID}>
          {t('next')}
        </Button>
      </>
    ) : (
      <>
        <Button variant='secondary' onClick={() => setStep(0)}>
          {t('previous')}
        </Button>
        <Button type='submit' form={FORM_ID}>
          {tCommon('confirm')}
        </Button>
      </>
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={t('title')} footer={footer}>
      <div role='alert' className={styles.warning}>
        {t('warning')}
      </div>

      <Steps items={stepItems} current={step} className={styles.steps} />

      <Form
        id={FORM_ID}
        schema={walletAuthSchema}
        defaultValues={{ companyName: '', companyIdCard: '', phone: '', captcha: '' }}
        onSubmit={() => {
          if (step === 0) {
            setStep(1);
            return;
          }

          toast.success(t('submitted'));
          onOpenChange(false);
        }}
        className={styles.form}
      >
        <Field label={t('companyName')} required>
          <Input name='companyName' placeholder={t('companyNamePlaceholder')} aria-label={t('companyName')} />
        </Field>

        <Field label={t('companyIdCard')} required>
          <Input name='companyIdCard' placeholder={t('companyIdCardPlaceholder')} aria-label={t('companyIdCard')} />
        </Field>

        <Field label={t('phone')} required>
          <Input name='phone' placeholder={t('phonePlaceholder')} inputMode='numeric' aria-label={t('phone')} />
        </Field>

        <Field label={t('captcha')} required>
          <Input name='captcha' placeholder={t('captchaPlaceholder')} inputMode='numeric' aria-label={t('captcha')} />
        </Field>
      </Form>
    </Dialog>
  );
}

export default WalletAuth;
