import type { ReactNode } from 'react';

import { cx } from '../cx';

import styles from './Empty.module.css';

export interface EmptyProps {
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Empty({ description = '暂无数据', children, className }: EmptyProps) {
  return (
    <output className={cx(styles.empty, className)}>
      <span className={styles.icon} aria-hidden='true'>
        ∅
      </span>
      <span className={styles.description}>{description}</span>
      {children !== undefined ? <span className={styles.extra}>{children}</span> : null}
    </output>
  );
}

export default Empty;
