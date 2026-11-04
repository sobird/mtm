import { getTranslations } from 'next-intl/server';

import styles from './RejectionReason.module.css';

/** Error-styled audit rejection block, mirroring the legacy `Reason` alert. */
export async function RejectionReason() {
  const t = await getTranslations('shop.rejection');

  return (
    <div role='alert' className={styles.reason}>
      <p className={styles.title}>{t('title')}</p>
      <ol className={styles.list}>
        <li>{t('reason1')}</li>
        <li>{t('reason2')}</li>
      </ol>
    </div>
  );
}

export default RejectionReason;
