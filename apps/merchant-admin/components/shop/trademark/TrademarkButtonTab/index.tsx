'use client';

import { useToast } from '@/components/ui';

import { ButtonTab } from '../ButtonTab';

/**
 * Client boundary for the trademark page actions: the page itself is an RSC and
 * cannot pass an `onClick` handler across the server/client boundary.
 */
export function TrademarkButtonTab() {
  const toast = useToast();

  return (
    <ButtonTab
      items={[
        {
          key: 'add',
          text: '新增商标',
          variant: 'primary',
          onClick: () => toast.info('商标功能暂未开放'),
        },
      ]}
    />
  );
}

export default TrademarkButtonTab;
