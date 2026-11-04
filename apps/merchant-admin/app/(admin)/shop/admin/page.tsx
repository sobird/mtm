import { PERMISSIONS } from '@mtm/contracts';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { PageContainer } from '@/components/layout/PageContainer';
import AdminForm from '@/components/shop/admin/AdminForm';
import RejectionReason from '@/components/shop/admin/RejectionReason';
import { requireMerchantPermission } from '@/lib/page-guard';

import styles from './page.module.css';

export async function generateMetadata(): Promise<Metadata> {
  const [t, app] = await Promise.all([getTranslations('shop.adminPage'), getTranslations('common.appTitle')]);

  return { title: `${t('title')} - ${app('merchant')}` };
}

export default async function ShopAdminPage() {
  await requireMerchantPermission(PERMISSIONS.MERCHANT_UPDATE);
  const [t, shop] = await Promise.all([getTranslations('shop.adminPage'), getTranslations('shop')]);

  return (
    <PageContainer
      title={t('title')}
      breadcrumbs={[
        { label: shop('breadcrumb.home'), href: '/' },
        { label: shop('breadcrumb.shop') },
        { label: shop('profile.title') },
      ]}
    >
      <RejectionReason />

      <div role='alert' className={styles.warning}>
        <span className={styles.warningIcon} aria-hidden='true'>
          !
        </span>
        <p className={styles.warningText}>
          {t('reviewing')}
          <span className={styles.link}>{t('viewApplication')}</span>
        </p>
      </div>

      <div role='alert' className={`${styles.warning} ${styles.danger}`}>
        <span className={`${styles.warningIcon} ${styles.dangerIcon}`} aria-hidden='true'>
          !
        </span>
        <p className={styles.warningText}>
          {t('rejected')}
          <span className={styles.link}>{t('edit')}</span>
        </p>
      </div>

      <AdminForm />
    </PageContainer>
  );
}
