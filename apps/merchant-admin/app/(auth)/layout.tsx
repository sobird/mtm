import type { ReactNode } from 'react';

import styles from './auth.module.css';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.brand}>开源电商商家管理后台</span>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>{children}</div>
      </main>

      <footer className={styles.footer}>
        <p>开源电商商家管理后台 · MIT License</p>
      </footer>
    </div>
  );
}
