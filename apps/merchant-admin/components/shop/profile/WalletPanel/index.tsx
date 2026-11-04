'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import WalletAuth from '../WalletAuth';
import WalletCard from '../WalletCard';

import styles from './WalletPanel.module.css';

export function WalletPanel() {
  const t = useTranslations('shop.wallet.demo');
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className={styles.panel}>
      <WalletCard
        account={t('account')}
        type={1}
        current
        balance={200}
        bindingBankCardNum={0}
        name={t('name')}
        phone='138****0000'
        walletId='123456'
        onChangeWallet={() => setAuthOpen(true)}
      />

      <WalletAuth open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}

export default WalletPanel;
