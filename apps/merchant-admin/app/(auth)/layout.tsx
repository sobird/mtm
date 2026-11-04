import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import styles from './auth.module.css';

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations('common.appTitle');
  const title = t('merchant');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.brand}>{title}</span>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>{children}</div>
      </main>

      <footer className={styles.footer}>
        <p>{title} · MIT License</p>
      </footer>
    </div>
  );
}
