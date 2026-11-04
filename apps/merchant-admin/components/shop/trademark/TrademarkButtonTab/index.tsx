'use client';

import { useTranslations } from 'next-intl';

import { useToast } from '@/components/ui';

import { ButtonTab } from '../ButtonTab';

/**
 * Client boundary for the trademark page actions: the page itself is an RSC and
 * cannot pass an `onClick` handler across the server/client boundary.
 */
export function TrademarkButtonTab() {
  const toast = useToast();
  const t = useTranslations('shop.trademark');

  return (
    <ButtonTab
      items={[
        {
          key: 'add',
          text: t('add'),
          variant: 'primary',
          onClick: () => toast.info(t('comingSoon')),
        },
      ]}
    />
  );
}

export default TrademarkButtonTab;
