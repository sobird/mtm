'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import styles from './ProfileTabs.module.css';

const TABS = [
  { href: '/shop/profile', labelKey: 'tabs.basic' },
  { href: '/shop/profile/principal', labelKey: 'tabs.principal' },
  { href: '/shop/profile/license', labelKey: 'tabs.license' },
  { href: '/shop/profile/wallet', labelKey: 'tabs.wallet' },
  { href: '/shop/profile/settlement', labelKey: 'tabs.settlement' },
] as const;

export function ProfileTabs() {
  const pathname = usePathname();
  const t = useTranslations('shop.profile');

  return (
    <nav className={styles.tabs} aria-label={t('tabsLabel')}>
      {TABS.map(tab => {
        const active = tab.href === '/shop/profile' ? pathname === tab.href : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={active ? `${styles.tab} ${styles.active}` : styles.tab}
            aria-current={active ? 'page' : undefined}
          >
            {t(tab.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

export default ProfileTabs;
