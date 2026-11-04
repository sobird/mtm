import { getTranslations } from 'next-intl/server';

import { Card, LabelValue } from '@/components/ui';

import styles from './SettlementInfo.module.css';

export async function SettlementInfo() {
  const t = await getTranslations('shop.settlement');

  return (
    <div className={styles.panel}>
      <Card title={t('title')}>
        <div className={styles.list}>
          <LabelValue label={t('depositThreshold')}>{t('depositThresholdValue')}</LabelValue>
          <LabelValue label={t('rate')}>{t('rateValue')}</LabelValue>
        </div>
      </Card>
    </div>
  );
}

export default SettlementInfo;
