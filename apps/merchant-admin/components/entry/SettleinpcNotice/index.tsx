'use client';

import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui';

import styles from './SettleinpcNotice.module.css';

export function SettleinpcNotice() {
  const t = useTranslations('entry.settleinpc');
  const tCommon = useTranslations('common');

  return (
    <div className={styles.page}>
      <div className={styles.box}>{t('notice')}</div>
      <Button
        size='lg'
        onClick={() => {
          void signOut({ callbackUrl: '/login' });
        }}
      >
        {tCommon('logout')}
      </Button>
    </div>
  );
}

export default SettleinpcNotice;
