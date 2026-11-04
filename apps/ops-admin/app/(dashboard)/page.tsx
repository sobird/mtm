import { Empty, PageContainer } from '@mtm/ui';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { callCoreApi } from '@/lib/core-api';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const [t, app] = await Promise.all([getTranslations('opsDashboard'), getTranslations('common.appTitle')]);

  return { title: `${t('title')} - ${app('ops')}` };
}

export default async function DashboardHomePage() {
  const t = await getTranslations('opsDashboard');

  let coreApiConnected = false;

  try {
    await callCoreApi('/me');
    coreApiConnected = true;
  } catch {
    coreApiConnected = false;
  }

  return (
    <PageContainer title={t('title')} description={t('description')}>
      <Empty description={coreApiConnected ? t('connected') : t('disconnected')} />
    </PageContainer>
  );
}
