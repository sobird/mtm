'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import SignContract from '@/components/admin/SignContract';
import { Button, Empty, Skeleton, Steps } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';

import CompanyStepForm, { buildCompanyDefaults } from './CompanyStepForm';
import type { EntryCompanyDetail, MerchantOptions } from './types';

import styles from './EntryCompany.module.css';

const FORM_ID = 'entry-company-form';

function companyMobile(company: Record<string, unknown> | undefined): string {
  const legalPerson = company?.legalPerson;
  const value =
    typeof legalPerson === 'object' && legalPerson !== null
      ? (legalPerson as Record<string, unknown>).mobile
      : undefined;

  return value === undefined || value === null ? '' : String(value);
}

export function EntryCompany() {
  const t = useTranslations('entry.company');
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [signOpen, setSignOpen] = useState(false);

  const stepTitles = [t('steps.subject'), t('steps.overview'), t('steps.qualification'), t('steps.shop')];
  const placeholders = [t('placeholders.none'), t('placeholders.qualification'), t('placeholders.shop')];

  const entryQuery = useQuery({
    queryKey: ['entryCompany'],
    queryFn: () => apiFetch<EntryCompanyDetail>('/api/merchant/entry'),
  });
  const optionsQuery = useQuery({
    queryKey: ['merchantOptions'],
    queryFn: () => apiFetch<MerchantOptions>('/api/merchant/options'),
  });

  const steps = stepTitles.map(title => ({ title }));

  const prev = () => {
    if (current === 0) {
      router.push('/settleinjx/shop');
      return;
    }

    setCurrent(value => value - 1);
  };

  const next = () => {
    setCurrent(value => Math.min(value + 1, stepTitles.length - 1));
  };

  if (entryQuery.isError || optionsQuery.isError) {
    return (
      <div className={styles.page}>
        <div className={styles.placeholder}>
          <Empty description={t('loadFailed')} />
        </div>
      </div>
    );
  }

  if (entryQuery.isPending || optionsQuery.isPending) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <Skeleton rows={6} />
        </div>
      </div>
    );
  }

  const entry = entryQuery.data;
  const company = entry.company ?? {};
  const defaults = buildCompanyDefaults(company);
  const lastStep = current === stepTitles.length - 1;

  return (
    <div className={styles.page}>
      <Steps items={steps} current={current} className={styles.steps} />

      <div className={styles.content}>
        <div hidden={current !== 0}>
          <CompanyStepForm id={FORM_ID} defaults={defaults} options={optionsQuery.data} onSubmit={next} />
        </div>

        {current > 0 ? (
          <div className={styles.placeholder}>
            <Empty description={placeholders[current - 1]} />
          </div>
        ) : null}
      </div>

      <div className={styles.footer}>
        <Button variant='secondary' onClick={prev}>
          {t('previous')}
        </Button>
        {current === 0 ? (
          <Button type='submit' form={FORM_ID}>
            {t('next')}
          </Button>
        ) : null}
        {current > 0 && !lastStep ? <Button onClick={next}>{t('next')}</Button> : null}
        {lastStep ? <Button onClick={() => setSignOpen(true)}>{t('done')}</Button> : null}
      </div>

      <SignContract
        open={signOpen}
        onOpenChange={setSignOpen}
        mobile={companyMobile(company)}
        contractId={entry.entryTaskId === undefined ? '' : String(entry.entryTaskId)}
        bizType={entry.bizType}
        state={entry.audit?.auditState}
      />
    </div>
  );
}

export default EntryCompany;
