'use client';

import { LogOut, User } from 'lucide-react';
import { signOut } from 'next-auth/react';

import type { ShellAccount } from './types';

import styles from './AdminShell.module.css';

export interface HeaderProps {
  account: ShellAccount;
}

export function Header({ account }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft} />
      <div className={styles.headerRight}>
        <span className={styles.avatar} aria-hidden='true'>
          <User size={16} />
        </span>
        <span className={styles.accountName}>{account.name}</span>
        <button
          type='button'
          className={styles.accountButton}
          onClick={() => {
            void signOut({ callbackUrl: '/login' });
          }}
        >
          <LogOut size={14} aria-hidden='true' />
          <span>退出登录</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
