'use client';

import { LogOut, Menu as MenuIcon, User } from 'lucide-react';
import { signOut } from 'next-auth/react';

import { Dropdown } from '@/components/ui';
import type { AccountDTO } from '@/lib/services/account';
import { useUiStore } from '@/stores/ui';

import styles from '../AdminShell/AdminShell.module.css';

export interface HeaderProps {
  account: AccountDTO;
}

export function Header({ account }: HeaderProps) {
  const toggleSidebar = useUiStore(state => state.toggleSidebar);

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button type='button' className={styles.headerButton} onClick={toggleSidebar} aria-label='切换侧边栏'>
          <MenuIcon size={18} aria-hidden='true' />
        </button>
      </div>

      <div className={styles.headerRight}>
        <Dropdown
          trigger={
            <button type='button' className={styles.accountButton} aria-label='账号菜单'>
              <span className={styles.avatar} aria-hidden='true'>
                <User size={16} />
              </span>
              <span className={styles.mobile}>{account.name || account.mobile}</span>
            </button>
          }
          items={[
            {
              key: 'logout',
              label: (
                <span className={styles.logoutLabel}>
                  <LogOut size={14} aria-hidden='true' />
                  退出登录
                </span>
              ),
              danger: true,
              onClick: () => {
                void signOut({ callbackUrl: '/login' });
              },
            },
          ]}
        />
      </div>
    </header>
  );
}

export default Header;
