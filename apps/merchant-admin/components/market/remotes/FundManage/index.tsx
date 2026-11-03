'use client';

import type { CSSProperties } from 'react';

import { Card, useToast } from '@/components/ui';
import { NO_PERMISSION_MESSAGE } from '@/lib/messages';

import styles from './FundManage.module.css';

export interface FundManageProps {
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}

export function FundManage({ className, style, bodyStyle }: FundManageProps) {
  const toast = useToast();

  return (
    <div style={style}>
      <Card className={className} title='资金管理'>
        <div className={styles.tiles} style={bodyStyle}>
          <button type='button' className={styles.tile} onClick={() => toast.error(NO_PERMISSION_MESSAGE)}>
            <span className={styles.icon} aria-hidden='true'>
              ¥
            </span>
            <span>我的钱包</span>
          </button>
          <button type='button' className={styles.tile} onClick={() => toast.error(NO_PERMISSION_MESSAGE)}>
            <span className={styles.icon} aria-hidden='true'>
              ≡
            </span>
            <span>对账单</span>
          </button>
        </div>
      </Card>
    </div>
  );
}

export default FundManage;
