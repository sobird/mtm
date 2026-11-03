import { Card, LabelValue } from '@/components/ui';

import styles from './SettlementInfo.module.css';

export function SettlementInfo() {
  return (
    <div className={styles.panel}>
      <Card title='基本信息'>
        <div className={styles.list}>
          <LabelValue label='保证金阈值'>10000元</LabelValue>
          <LabelValue label='结算费率'>20%</LabelValue>
        </div>
      </Card>
    </div>
  );
}

export default SettlementInfo;
