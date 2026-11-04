import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { PageContainer } from '@/components/layout/PageContainer';

export default async function NotFound() {
  const t = await getTranslations('common');

  return (
    <PageContainer title={t('notFoundTitle')} description={t('notFoundDescription')}>
      <p>
        <Link href='/'>{t('backHome')}</Link>
      </p>
    </PageContainer>
  );
}
