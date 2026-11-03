'use client';

import { useQuery } from '@tanstack/react-query';

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
    return <Empty description='加载失败' />;
  }

  const account = accountQuery.data;
  const merchant = merchantQuery.data;

  return (
    <div className={styles.list}>
      <LabelValue label='店铺ID'>{display(merchant?.id)}</LabelValue>
      <LabelValue label='账号名'>{display(account?.login)}</LabelValue>
      <LabelValue label='登录密码'>******</LabelValue>
      <LabelValue label='绑定手机'>{maskMobile(account?.mobile)}</LabelValue>
      <LabelValue label='手机验证'>关闭</LabelValue>
      <LabelValue label='最近登录'>查看</LabelValue>
    </div>
  );
}

export default ProfileForm;
