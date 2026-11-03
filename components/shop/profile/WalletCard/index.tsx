'use client';

import { Button, Card, LabelValue, Tag, Tooltip, useToast } from '@/components/ui';

import styles from './WalletCard.module.css';

export interface WalletCardProps {
  account: string;
  type: 1 | 2;
  current?: boolean;
  balance: number;
  bindingBankCardNum?: number | string;
  name?: string;
  phone?: string;
  walletId?: string;
  onChangeWallet?: () => void;
}

const BALANCE_FORMAT = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function WalletCard({
  account,
  type,
  current = true,
  balance,
  bindingBankCardNum,
  name,
  phone,
  walletId,
  onChangeWallet,
}: WalletCardProps) {
  const toast = useToast();
  const typeLabel = type === 1 ? '企业钱包' : '个人钱包';
  const hasBankCard = Boolean(bindingBankCardNum);

  let note = null;
  if (current) {
    if (!hasBankCard) {
      note = (
        <div className={styles.note}>
          绑定银行卡后可正常使用提现业务，请前往
          <Button variant='ghost' size='sm' onClick={() => toast.info('功能即将上线')}>
            绑定银行卡
          </Button>
        </div>
      );
    }
  } else {
    note = <div className={styles.note}>如需提现，请先变更为当前使用</div>;
  }

  const withdrawButton = (
    <Button variant='secondary' size='sm' disabled={balance === 0} onClick={() => toast.info('功能即将上线')}>
      去提现
    </Button>
  );

  return (
    <Card
      title={typeLabel}
      extra={
        <div className={styles.headerActions}>
          <Button variant='ghost' size='sm' onClick={onChangeWallet}>
            切换为当前使用
          </Button>
          <Tag tone={current ? 'info' : 'neutral'}>{current ? '当前使用中' : '曾经使用过'}</Tag>
        </div>
      }
    >
      <div className={styles.balanceRow}>
        <div className={styles.balanceCol}>
          <p className={styles.balanceLabel}>钱包余额</p>
          <p className={styles.balanceValue}>
            <span className={styles.balanceUnit}>¥</span>
            <span>{BALANCE_FORMAT.format(balance)}</span>
          </p>
        </div>
        {current ? (
          balance === 0 ? (
            <Tooltip content='暂无余额'>
              <span>{withdrawButton}</span>
            </Tooltip>
          ) : (
            withdrawButton
          )
        ) : null}
      </div>

      {note}

      <div className={styles.meta}>
        <LabelValue label={type === 1 ? '企业名称' : '姓名'}>{name ?? '--'}</LabelValue>
        <LabelValue label='钱包账号'>{account}</LabelValue>
        <LabelValue label='绑定手机'>{phone ?? '--'}</LabelValue>
        <LabelValue label='钱包ID'>{walletId ?? '--'}</LabelValue>
      </div>
    </Card>
  );
}

export default WalletCard;
