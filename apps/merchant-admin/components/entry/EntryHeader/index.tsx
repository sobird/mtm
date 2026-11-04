'use client';

import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { Dropdown } from '@/components/ui';

import styles from './EntryHeader.module.css';

export function EntryHeader() {
  const t = useTranslations('entry');
  const tCommon = useTranslations('common');

  return (
    <header className={styles.header}>
      <div className={styles.headerBox}>
        <div className={styles.logoRow}>
          <span className={styles.logoMark} aria-hidden='true'>
            {tCommon('brandMark')}
          </span>
          <span className={styles.brand}>{t('header.brand')}</span>
        </div>

        <div className={styles.item}>
          <Dropdown
            trigger={
              <button type='button' className={styles.username}>
                demo
              </button>
            }
            items={[
              {
                key: 'logout',
                label: tCommon('logout'),
                onClick: () => {
                  void signOut({ callbackUrl: '/login' });
                },
              },
            ]}
          />
        </div>
      </div>
    </header>
  );
}

export default EntryHeader;
