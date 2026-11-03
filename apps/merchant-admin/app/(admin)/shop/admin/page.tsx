import { PERMISSIONS } from '@mtm/contracts';

import { PageContainer } from '@/components/layout/PageContainer';
import AdminForm from '@/components/shop/admin/AdminForm';
import RejectionReason from '@/components/shop/admin/RejectionReason';
import { requireMerchantPermission } from '@/lib/page-guard';

import styles from './page.module.css';

export default async function ShopAdminPage() {
  await requireMerchantPermission(PERMISSIONS.MERCHANT_UPDATE);

  return (
    <PageContainer
      title='店铺管理员'
      breadcrumbs={[{ label: '首页', href: '/' }, { label: '店铺' }, { label: '店铺信息' }]}
    >
      <RejectionReason />

      <div role='alert' className={styles.warning}>
        <span className={styles.warningIcon} aria-hidden='true'>
          !
        </span>
        <p className={styles.warningText}>
          您已申请修改管理员信息，当前处于审核中，审核期间不可以再次修改信息，感谢您的耐心等待。
          <span className={styles.link}>查看申请信息</span>
        </p>
      </div>

      <div role='alert' className={`${styles.warning} ${styles.danger}`}>
        <span className={`${styles.warningIcon} ${styles.dangerIcon}`} aria-hidden='true'>
          !
        </span>
        <p className={styles.warningText}>
          审核驳回。您申请修改的管理员信息审核不通过，请针对驳回原因进行修改后再次提交
          <span className={styles.link}>去修改</span>
        </p>
      </div>

      <AdminForm />
    </PageContainer>
  );
}
