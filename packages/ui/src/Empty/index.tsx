'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { cx } from '../cx';

import styles from './Empty.module.css';

export interface EmptyProps {
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Empty({ description, children, className }: EmptyProps) {
  const t = useTranslations();

  return (
    <output className={cx(styles.empty, className)}>
      <span className={styles.icon} aria-hidden='true'>
        ∅
      </span>
      <span className={styles.description}>{description ?? t('common.noData')}</span>
      {children !== undefined ? <span className={styles.extra}>{children}</span> : null}
    </output>
  );
}

export default Empty;
