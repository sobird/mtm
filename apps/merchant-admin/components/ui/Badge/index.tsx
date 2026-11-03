import type { ReactNode } from 'react';

import { cx } from '../cx';

import styles from './Badge.module.css';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span className={cx(styles.badge, styles[tone], className)} data-tone={tone}>
      {children}
    </span>
  );
}

export default Badge;
