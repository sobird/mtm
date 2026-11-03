'use client';

import { useQuery } from '@tanstack/react-query';

import { Card, Empty, LabelValue, Skeleton } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

import type { MerchantProfileDTO } from '../types';

import styles from './PrincipalInfo.module.css';

function display(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '--';
  }

  return String(value);
}

function PhotoLinks({ photos }: { photos?: string[] | null }) {
  const list = (photos ?? []).filter(Boolean);

  if (list.length === 0) {
    return <span>--</span>;
  }

  return (
    <span className={styles.links}>
      {list.map(url => (
        <a key={url} href={url} target='_blank' rel='noreferrer' className={styles.link}>
          查看证件照片
        </a>
      ))}
    </span>
  );
}

export function PrincipalInfo() {
  const merchantQuery = useQuery({
    queryKey: queryKeys.merchant,
    queryFn: () => apiFetch<MerchantProfileDTO>('/api/merchant/detail'),
  });

  if (merchantQuery.isPending) {
    return <Skeleton rows={6} />;
  }

  if (merchantQuery.isError) {
    return <Empty description='加载失败' />;
  }

  const legal = merchantQuery.data?.legalPersonInfo;
  const company = merchantQuery.data?.enteredCompanyInfo;

  return (
    <div className={styles.panel}>
      <Card title='法人信息'>
        <div className={styles.list}>
          <LabelValue label='法人姓名'>{display(legal?.name)}</LabelValue>
          <LabelValue label='法人电话'>{display(legal?.phone)}</LabelValue>
          <LabelValue label='法人证件类型'>{legal?.cardValidateType === 1 ? '身份证' : '--'}</LabelValue>
          <LabelValue label='法人证件号'>{display(legal?.cardNum)}</LabelValue>
          <LabelValue label='证件有效期'>{display(legal?.validate)}</LabelValue>
          <LabelValue label='证件照片'>
            <PhotoLinks photos={legal?.idCardPhotos} />
          </LabelValue>
        </div>
      </Card>

      <Card title='企业信息'>
        <div className={styles.list}>
          <LabelValue label='营业执照'>
            {company?.businessLicense ? (
              <a href={company.businessLicense} target='_blank' rel='noreferrer' className={styles.link}>
                查看营业执照
              </a>
            ) : (
              '--'
            )}
          </LabelValue>
          <LabelValue label='执照有效期'>{display(company?.operatingTime)}</LabelValue>
          <LabelValue label='统一社会信用代码'>{display(company?.socialCreditCode)}</LabelValue>
          <LabelValue label='公司名称'>{display(company?.name)}</LabelValue>
          <LabelValue label='公司类型'>{display(company?.type)}</LabelValue>
          <LabelValue label='经营地址'>{display(company?.address || company?.operatingAddress)}</LabelValue>
          <LabelValue label='注册资本'>{display(company?.registeredCapital)}</LabelValue>
        </div>
      </Card>
    </div>
  );
}

export default PrincipalInfo;
