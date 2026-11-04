'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { Button, Card } from '@/components/ui';

import styles from './success.module.css';

export default function RegisterSuccessPage() {
  const t = useTranslations('auth.register');
  const router = useRouter();

  return (
    <Card className={styles.card}>
      <div className={styles.result}>
        <span className={styles.icon} aria-hidden='true'>
          ✓
        </span>
        <h1 className={styles.title}>{t('successTitle')}</h1>
        <p className={styles.subtitle}>{t('successSubtitle')}</p>
        <div className={styles.actions}>
          <Button type='button' onClick={() => router.push('/login')}>
            {t('goToLogin')}
          </Button>
          <Button type='button' variant='secondary' onClick={() => router.push('/register')}>
            {t('back')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
