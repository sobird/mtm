'use client';

import { useRouter } from 'next/navigation';

import { Button, Card } from '@/components/ui';

import styles from './success.module.css';

export default function RegisterSuccessPage() {
  const router = useRouter();

  return (
    <Card className={styles.card}>
      <div className={styles.result}>
        <span className={styles.icon} aria-hidden='true'>
          ✓
        </span>
        <h1 className={styles.title}>注册成功</h1>
        <p className={styles.subtitle}>恭喜您已成功注册开源电商商户，请遵守当地法律法规。</p>
        <div className={styles.actions}>
          <Button type='button' onClick={() => router.push('/login')}>
            去登录
          </Button>
          <Button type='button' variant='secondary' onClick={() => router.push('/register')}>
            返回
          </Button>
        </div>
      </div>
    </Card>
  );
}
