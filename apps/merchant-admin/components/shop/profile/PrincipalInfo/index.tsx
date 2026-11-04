'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { Card, Empty, LabelValue, Skeleton } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

import { display } from '../display';
import type { MerchantProfileDTO } from '../types';

import styles from './PrincipalInfo.module.css';

function PhotoLinks({ photos, label }: { photos?: string[] | null; label: string }) {
  const list = (photos ?? []).filter(Boolean);

  if (list.length === 0) {
    return <span>--</span>;
  }

  return (
    <span className={styles.links}>
      {list.map(url => (
        <a key={url} href={url} target='_blank' rel='noreferrer' className={styles.link}>
          {label}
        </a>
      ))}
    </span>
  );
}

export function PrincipalInfo() {
  const t = useTranslations('shop.principal');
  const tCommon = useTranslations('common');
  const merchantQuery = useQuery({
    queryKey: queryKeys.merchant,
    queryFn: () => apiFetch<MerchantProfileDTO>('/api/merchant/detail'),
  });

  if (merchantQuery.isPending) {
    return <Skeleton rows={6} />;
  }

  if (merchantQuery.isError) {
    return <Empty description={tCommon('loadFailed')} />;
  }

  const legal = merchantQuery.data?.legalPersonInfo;
  const company = merchantQuery.data?.enteredCompanyInfo;

  return (
    <div className={styles.panel}>
      <Card title={t('legalTitle')}>
        <div className={styles.list}>
          <LabelValue label={t('legalName')}>{display(legal?.name)}</LabelValue>
          <LabelValue label={t('legalPhone')}>{display(legal?.phone)}</LabelValue>
          <LabelValue label={t('legalCardType')}>
            {legal?.cardValidateType === 1 ? t('legalCardTypeId') : '--'}
          </LabelValue>
          <LabelValue label={t('legalCardNum')}>{display(legal?.cardNum)}</LabelValue>
          <LabelValue label={t('legalValid')}>{display(legal?.validate)}</LabelValue>
          <LabelValue label={t('legalPhotos')}>
            <PhotoLinks photos={legal?.idCardPhotos} label={t('viewPhoto')} />
          </LabelValue>
        </div>
      </Card>

      <Card title={t('companyTitle')}>
        <div className={styles.list}>
          <LabelValue label={t('businessLicense')}>
            {company?.businessLicense ? (
              <a href={company.businessLicense} target='_blank' rel='noreferrer' className={styles.link}>
                {t('viewBusinessLicense')}
              </a>
            ) : (
              '--'
            )}
          </LabelValue>
          <LabelValue label={t('operatingTime')}>{display(company?.operatingTime)}</LabelValue>
          <LabelValue label={t('socialCreditCode')}>{display(company?.socialCreditCode)}</LabelValue>
          <LabelValue label={t('companyName')}>{display(company?.name)}</LabelValue>
          <LabelValue label={t('companyType')}>{display(company?.type)}</LabelValue>
          <LabelValue label={t('address')}>{display(company?.address || company?.operatingAddress)}</LabelValue>
          <LabelValue label={t('registeredCapital')}>{display(company?.registeredCapital)}</LabelValue>
        </div>
      </Card>
    </div>
  );
}

export default PrincipalInfo;
