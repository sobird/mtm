'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import styles from './ProfileTabs.module.css';

const TABS = [
  { href: '/shop/profile', label: '基本信息' },
  { href: '/shop/profile/principal', label: '主体信息' },
  { href: '/shop/profile/license', label: '店铺经营许可' },
  { href: '/shop/profile/wallet', label: '钱包信息' },
  { href: '/shop/profile/settlement', label: '结算信息' },
] as const;

export function ProfileTabs() {
  const pathname = usePathname();

  return (
    <nav className={styles.tabs} aria-label='店铺资料导航'>
      {TABS.map(tab => {
        const active = tab.href === '/shop/profile' ? pathname === tab.href : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={active ? `${styles.tab} ${styles.active}` : styles.tab}
            aria-current={active ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default ProfileTabs;
