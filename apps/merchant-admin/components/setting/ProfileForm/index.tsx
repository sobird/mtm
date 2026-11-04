'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { Empty, LabelValue, Skeleton } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { AccountDTO } from '@/lib/services/account';
import type { MerchantDTO } from '@/lib/services/merchant';

import styles from './ProfileForm.module.css';

const MOBILE_MASK = /^(\d{3})\d{4}(\d{4})$/;

function display(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '--';
  }

  return String(value);
}

function maskMobile(mobile?: string): string {
  if (!mobile) {
    return '--';
  }

  return mobile.replace(MOBILE_MASK, '$1****$2');
}

/** Display-only account profile (the legacy page has no editable fields). */
export function ProfileForm() {
  const t = useTranslations('setting.profile');
  const tCommon = useTranslations('common');
  const accountQuery = useQuery({
    queryKey: queryKeys.account,
    queryFn: () => apiFetch<AccountDTO>('/api/account'),
  });
  const merchantQuery = useQuery({
    queryKey: queryKeys.merchant,
    queryFn: () => apiFetch<MerchantDTO>('/api/merchant/detail'),
  });

  if (accountQuery.isPending || merchantQuery.isPending) {
    return <Skeleton rows={6} />;
  }

  if (accountQuery.isError || merchantQuery.isError) {
    return <Empty description={tCommon('loadFailed')} />;
  }

  const account = accountQuery.data;
  const merchant = merchantQuery.data;

  return (
    <div className={styles.list}>
      <LabelValue label={t('shopId')}>{display(merchant?.id)}</LabelValue>
      <LabelValue label={t('account')}>{display(account?.login)}</LabelValue>
      <LabelValue label={t('password')}>******</LabelValue>
      <LabelValue label={t('mobile')}>{maskMobile(account?.mobile)}</LabelValue>
      <LabelValue label={t('mobileVerify')}>{t('off')}</LabelValue>
      <LabelValue label={t('lastLogin')}>{tCommon('view')}</LabelValue>
    </div>
  );
}

export default ProfileForm;
