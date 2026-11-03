import { PageContainer } from '@/components/layout/PageContainer';
import ProfileForm from '@/components/setting/ProfileForm';

import styles from './page.module.css';

const NAV_ITEMS = [
  { label: '基本信息', active: true },
  { label: '登录密码', active: false },
  { label: '手机号码', active: false },
  { label: '登录设置', active: false },
  { label: '登录记录', active: false },
];

export default function SettingPage() {
  return (
    <PageContainer title='账户设置' breadcrumbs={[{ label: '首页', href: '/' }, { label: '账户设置' }]}>
      <div className={styles.layout}>
        <nav className={styles.nav} aria-label='账户设置导航'>
          <ul className={styles.navList}>
            {NAV_ITEMS.map(item => (
              <li key={item.label} className={item.active ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                {item.active ? (
                  <span className={styles.navLabel} aria-current='page'>
                    {item.label}
                  </span>
                ) : (
                  <span className={styles.navLabel}>{item.label}</span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <section className={styles.panel} aria-label='基本信息'>
          <ProfileForm />
        </section>
      </div>
    </PageContainer>
  );
}
