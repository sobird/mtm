'use client';

import type { Translate } from '@mtm/i18n';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useFormState } from 'react-hook-form';
import { z } from 'zod';

import { Button, Checkbox, Dialog, Field, Form, Tooltip, useToast } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { translateApiError } from '@/lib/translate-api-error';

import FieldCaptcha from '../FieldCaptcha';

import styles from './SignContract.module.css';

function createSignSchema(t: Translate) {
  return z.object({
    captcha: z.string().regex(/^\d{6}$/, t('validation.captchaSixDigits')),
    policy: z.boolean().refine(value => value, t('validation.cooperationPolicyRequired')),
  });
}

export interface SignContractProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mobile: string;
  contractId: string;
  bizType?: number;
  state?: number;
}

function SignSubmitButton({ loading }: { loading: boolean }) {
  const t = useTranslations('entry.signContract');
  const { isSubmitting } = useFormState();

  return (
    <Button type='submit' className={styles.submit} loading={loading || isSubmitting}>
      {t('submit')}
    </Button>
  );
}

export function SignContract({ open, onOpenChange, mobile, contractId, bizType, state }: SignContractProps) {
  const t = useTranslations('entry.signContract');
  const tCaptcha = useTranslations('entry.captcha');
  const tRoot = useTranslations();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const schema = useMemo(() => createSignSchema(tRoot), [tRoot]);
  const expired = bizType === 100 && state === 30;

  const handleSubmit = async () => {
    setLoading(true);

    try {
      await apiFetch<{ url: string }>('/api/venus/sign', {
        method: 'POST',
        body: { contractId },
      });

      toast.success(t('success'));
      onOpenChange(false);
    } catch (error) {
      toast.error(translateApiError(error, tRoot, 'entry.signContract.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={t('title')}>
      <div className={styles.box}>
        <div className={styles.alert} role='alert'>
          {expired ? t('expiredNotice') : t('notice')}
        </div>

        <p className={styles.tip}>
          {t('captchaSentTo')}
          <strong>{mobile}</strong>
          {t('changeMobileTip')}
        </p>

        <Form
          schema={schema}
          defaultValues={{ captcha: '', policy: false }}
          onSubmit={handleSubmit}
          className={styles.form}
        >
          <Field label={tCaptcha('label')} required>
            <FieldCaptcha name='captcha' mobile={mobile} placeholder={tCaptcha('placeholder')} />
          </Field>

          <Checkbox
            name='policy'
            className={styles.policy}
            label={
              <>
                {t('policyPrefix')}
                <span className={styles.policyName}>{t('policyName')}</span>
                <Tooltip content={t('policyTip')}>
                  <span
                    className={styles.info}
                    role='button'
                    tabIndex={0}
                    aria-label={t('policyInfo')}
                    onClick={event => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onKeyDown={event => {
                      if (event.key === ' ' || event.key === 'Enter') {
                        event.preventDefault();
                        event.stopPropagation();
                      }
                    }}
                  >
                    ⓘ
                  </span>
                </Tooltip>
              </>
            }
          />

          <SignSubmitButton loading={loading} />
        </Form>
      </div>
    </Dialog>
  );
}

export default SignContract;
