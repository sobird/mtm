// 资金管理 卡片组件
declare module 'market/latest-news' {
  import { FC } from 'react';
  import { CardProps } from '@mtm/shared/components';

  export interface LatestNewsCardProps extends CardProps {
    callback?: (data: any) => any;
  }

  const LatestNewsCard: FC<LatestNewsCardProps>;
  export default LatestNewsCard;
}

// 营销活动 卡片组件
declare module 'market/market-activity' {
  import { FC } from 'react';
  import { CardProps } from '@mtm/shared/components';

  export interface MarketActivityCardProps extends CardProps {
    callback?: (data: any) => any;
    max?: number;
  }

  const MarketActivityCard: FC<MarketActivityCardProps>;
  export default MarketActivityCard;
}

// 资金管理 卡片组件
declare module 'market/fund-manage' {
  import { FC } from 'react';
  import { CardProps } from '@mtm/shared/components';

  // interface FundManageCardProps extends CardProps {}

  const FundManageCard: FC<CardProps>;
  export default FundManageCard;
}
