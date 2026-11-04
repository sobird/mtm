'use client';

import { LocaleSwitcher } from '@mtm/ui';
import { LogOut, Menu as MenuIcon, User } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { Dropdown } from '@/components/ui';
import type { AccountDTO } from '@/lib/services/account';
import { useUiStore } from '@/stores/ui';

import styles from '../AdminShell/AdminShell.module.css';

export interface HeaderProps {
  account: AccountDTO;
}

export function Header({ account }: HeaderProps) {
  const t = useTranslations('common');
  const toggleSidebar = useUiStore(state => state.toggleSidebar);

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button type='button' className={styles.headerButton} onClick={toggleSidebar} aria-label={t('toggleSidebar')}>
          <MenuIcon size={18} aria-hidden='true' />
        </button>
      </div>

      <div className={styles.headerRight}>
        <LocaleSwitcher />
        <Dropdown
          trigger={
            <button type='button' className={styles.accountButton} aria-label={t('accountMenu')}>
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
                  {t('logout')}
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
