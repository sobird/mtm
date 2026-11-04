import { getTranslations } from 'next-intl/server';

import styles from './EntryWarningAlert.module.css';

export async function EntryWarningAlert() {
  const t = await getTranslations('entry.warning');

  return (
    <div className={styles.reminder}>
      <div className={styles.alert}>
        <div className={styles.content}>
          <p className={styles.message}>{t('message')}</p>
          <p className={styles.description}>{t('description')}</p>
        </div>
      </div>
    </div>
  );
}

export default EntryWarningAlert;
