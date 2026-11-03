import type { ReactNode } from 'react';

import { cx } from '../cx';

import styles from './Steps.module.css';

export interface StepItem {
  title: ReactNode;
  description?: ReactNode;
}

export interface StepsProps {
  items: StepItem[];
  current: number;
  className?: string;
}

export function Steps({ items, current, className }: StepsProps) {
  return (
    <ol className={cx(styles.steps, className)}>
      {items.map((item, index) => {
        const status = index < current ? 'finish' : index === current ? 'process' : 'wait';
        return (
          <li
            key={String(item.title)}
            className={cx(styles.step, styles[status])}
            aria-current={index === current ? 'step' : undefined}
          >
            <span className={styles.marker} aria-hidden='true'>
              {index < current ? '✓' : index + 1}
            </span>
            <span className={styles.content}>
              <span className={styles.title}>{item.title}</span>
              {item.description !== undefined ? <span className={styles.description}>{item.description}</span> : null}
            </span>
            {index < items.length - 1 ? <span className={styles.connector} aria-hidden='true' /> : null}
          </li>
        );
      })}
    </ol>
  );
}

export default Steps;
