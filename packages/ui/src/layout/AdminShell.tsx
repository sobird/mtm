'use client';

import type { ReactNode } from 'react';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import type { MenuNode, ShellAccount } from './types';

import styles from './AdminShell.module.css';

export interface AdminShellProps {
  title: string;
  menu: MenuNode[];
  account: ShellAccount;
  children: ReactNode;
}

export function AdminShell({ title, menu, account, children }: AdminShellProps) {
  return (
    <div className={styles.shell}>
      <Sidebar title={title} menu={menu} />

      <div className={styles.body}>
        <Header account={account} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

export default AdminShell;
