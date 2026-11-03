import type { ReactNode } from 'react';

import { cx } from '../cx';

import styles from './LabelValue.module.css';

export type LabelValueLayout = 'horizontal' | 'vertical';

export interface LabelValueProps {
  label: ReactNode;
  children: ReactNode;
  layout?: LabelValueLayout;
  className?: string;
}

export function LabelValue({ label, children, layout = 'horizontal', className }: LabelValueProps) {
  return (
    <dl className={cx(styles.pair, styles[layout], className)}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{children}</dd>
    </dl>
  );
}

export default LabelValue;
