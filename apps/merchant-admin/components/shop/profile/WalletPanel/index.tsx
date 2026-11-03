'use client';

import { useState } from 'react';

import WalletAuth from '../WalletAuth';
import WalletCard from '../WalletCard';

import styles from './WalletPanel.module.css';

export function WalletPanel() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className={styles.panel}>
      <WalletCard
        account='示例家居旗舰店'
        type={1}
        current
        balance={200}
        bindingBankCardNum={0}
        name='示例联系人'
        phone='138****0000'
        walletId='123456'
        onChangeWallet={() => setAuthOpen(true)}
      />

      <WalletAuth open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}

export default WalletPanel;
