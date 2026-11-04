'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import { Card, useToast } from '@/components/ui';

import styles from './FundManage.module.css';

export interface FundManageProps {
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}

export function FundManage({ className, style, bodyStyle }: FundManageProps) {
  const toast = useToast();
  const t = useTranslations('dashboard.fund');
  const tCommon = useTranslations('common');

  return (
    <div style={style}>
      <Card className={className} title={t('title')}>
        <div className={styles.tiles} style={bodyStyle}>
          <button type='button' className={styles.tile} onClick={() => toast.error(tCommon('noPermission'))}>
            <span className={styles.icon} aria-hidden='true'>
              ¥
            </span>
            <span>{t('wallet')}</span>
          </button>
          <button type='button' className={styles.tile} onClick={() => toast.error(tCommon('noPermission'))}>
            <span className={styles.icon} aria-hidden='true'>
              ≡
            </span>
            <span>{t('statement')}</span>
          </button>
        </div>
      </Card>
    </div>
  );
}

export default FundManage;
