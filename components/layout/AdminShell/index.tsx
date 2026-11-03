'use client';

import type { ReactNode } from 'react';

import type { AccountDTO } from '@/lib/services/account';
import type { MenuBadgeDTO, MenuItemDTO } from '@/lib/services/menu';

import { Header } from '../Header';
import { Sidebar } from '../Sidebar';

import styles from './AdminShell.module.css';

export interface AdminShellProps {
  menuItems: MenuItemDTO[];
  favorites: MenuItemDTO[];
  badges: MenuBadgeDTO[];
  account: AccountDTO;
  children: ReactNode;
}

export function AdminShell({ menuItems, favorites, badges, account, children }: AdminShellProps) {
  return (
    <div className={styles.shell}>
      <Sidebar menuItems={menuItems} favorites={favorites} badges={badges} />

      <div className={styles.body}>
        <Header account={account} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

export default AdminShell;
