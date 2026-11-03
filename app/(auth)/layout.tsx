import type { ReactNode } from 'react';

import styles from './auth.module.css';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.brand}>美团电商商家管理后台</span>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>{children}</div>
      </main>

      <footer className={styles.footer}>
        <p>©2020 meituan.com 京ICP备10211739号</p>
        <p>京公网安备11000002002052号</p>
      </footer>
    </div>
  );
}
