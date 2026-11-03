import type { ReactNode } from 'react';

import { cx } from '../cx';

import styles from './Tag.module.css';

export type TagTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface TagProps {
  tone?: TagTone;
  children: ReactNode;
  className?: string;
}

export function Tag({ tone = 'neutral', children, className }: TagProps) {
  return (
    <span className={cx(styles.tag, styles[tone], className)} data-tone={tone}>
      {children}
    </span>
  );
}

export default Tag;
