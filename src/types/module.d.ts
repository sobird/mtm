// 资金管理 卡片组件
declare module 'market/latest-news' {
  import { FC } from 'react';

  export interface LatestNewsCardProps {
    callback?: (data: any) => any;
  }

  const LatestNewsCard: FC<LatestNewsCardProps>;
  export default LatestNewsCard;
}

// 营销活动 卡片组件
declare module 'market/market-activity' {
  import { FC } from 'react';

  export interface MarketActivityCardProps {
    callback?: (data: any) => any;
    max?: number;
  }

  const MarketActivityCard: FC<MarketActivityCardProps>;
  export default MarketActivityCard;
}

// 资金管理 卡片组件
declare module 'market/fund-manage' {
  import { FC } from 'react';

  const FundManageCard: FC;
  export default FundManageCard;
}
