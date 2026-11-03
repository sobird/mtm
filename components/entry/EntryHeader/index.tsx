'use client';

import { signOut } from 'next-auth/react';

import { Dropdown } from '@/components/ui';

import styles from './EntryHeader.module.css';

export function EntryHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerBox}>
        <div className={styles.logoRow}>
          <img className={styles.logo} src='/assets/mtm_logo.png' alt='美团电商' />
          <span className={styles.brand}>商家入驻平台</span>
        </div>

        <div className={styles.item}>
          <Dropdown
            trigger={
              <button type='button' className={styles.username}>
                sobird
              </button>
            }
            items={[
              {
                key: 'logout',
                label: '退出登录',
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
