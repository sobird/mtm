'use client';

import { useLocale, useTranslations } from 'next-intl';

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
  const t = useTranslations('shop.wallet');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const balanceFormat = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const typeLabel = type === 1 ? t('types.enterprise') : t('types.personal');
  const hasBankCard = Boolean(bindingBankCardNum);

  let note = null;
  if (current) {
    if (!hasBankCard) {
      note = (
        <div className={styles.note}>
          {t('bankCardNote')}
          <Button variant='ghost' size='sm' onClick={() => toast.info(tCommon('comingSoon'))}>
            {t('bindBankCard')}
          </Button>
        </div>
      );
    }
  } else {
    note = <div className={styles.note}>{t('changeNote')}</div>;
  }

  const withdrawButton = (
    <Button variant='secondary' size='sm' disabled={balance === 0} onClick={() => toast.info(tCommon('comingSoon'))}>
      {t('withdraw')}
    </Button>
  );

  return (
    <Card
      title={typeLabel}
      extra={
        <div className={styles.headerActions}>
          <Button variant='ghost' size='sm' onClick={onChangeWallet}>
            {t('switchCurrent')}
          </Button>
          <Tag tone={current ? 'info' : 'neutral'}>{current ? t('status.current') : t('status.previous')}</Tag>
        </div>
      }
    >
      <div className={styles.balanceRow}>
        <div className={styles.balanceCol}>
          <p className={styles.balanceLabel}>{t('balance')}</p>
          <p className={styles.balanceValue}>
            <span className={styles.balanceUnit}>¥</span>
            <span>{balanceFormat.format(balance)}</span>
          </p>
        </div>
        {current ? (
          balance === 0 ? (
            <Tooltip content={t('noBalance')}>
              <span>{withdrawButton}</span>
            </Tooltip>
          ) : (
            withdrawButton
          )
        ) : null}
      </div>

      {note}

      <div className={styles.meta}>
        <LabelValue label={type === 1 ? t('enterpriseName') : t('name')}>{name ?? '--'}</LabelValue>
        <LabelValue label={t('account')}>{account}</LabelValue>
        <LabelValue label={t('phone')}>{phone ?? '--'}</LabelValue>
        <LabelValue label={t('id')}>{walletId ?? '--'}</LabelValue>
      </div>
    </Card>
  );
}

export default WalletCard;
