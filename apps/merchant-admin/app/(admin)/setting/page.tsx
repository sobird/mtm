import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { PageContainer } from '@/components/layout/PageContainer';
import ProfileForm from '@/components/setting/ProfileForm';

import styles from './page.module.css';

const NAV_ITEMS = [
  { labelKey: 'nav.basic', active: true },
  { labelKey: 'nav.password', active: false },
  { labelKey: 'nav.mobile', active: false },
  { labelKey: 'nav.loginSettings', active: false },
  { labelKey: 'nav.loginRecords', active: false },
];

export async function generateMetadata(): Promise<Metadata> {
  const [t, app] = await Promise.all([getTranslations('setting'), getTranslations('common.appTitle')]);

  return { title: `${t('title')} - ${app('merchant')}` };
}

export default async function SettingPage() {
  const [t, common] = await Promise.all([getTranslations('setting'), getTranslations('common')]);

  return (
    <PageContainer title={t('title')} breadcrumbs={[{ label: common('home'), href: '/' }, { label: t('title') }]}>
      <div className={styles.layout}>
        <nav className={styles.nav} aria-label={t('navLabel')}>
          <ul className={styles.navList}>
            {NAV_ITEMS.map(item => (
              <li key={item.labelKey} className={item.active ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                {item.active ? (
                  <span className={styles.navLabel} aria-current='page'>
                    {t(item.labelKey)}
                  </span>
                ) : (
                  <span className={styles.navLabel}>{t(item.labelKey)}</span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <section className={styles.panel} aria-label={t('basicInfo')}>
          <ProfileForm />
        </section>
      </div>
    </PageContainer>
  );
}
