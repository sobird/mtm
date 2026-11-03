import type { ReactNode } from 'react';

import { cx } from '../cx';

import styles from './Card.module.css';

export interface CardProps {
  title?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, extra, children, className }: CardProps) {
  return (
    <section className={cx(styles.card, className)}>
      {title !== undefined || extra !== undefined ? (
        <header className={styles.header}>
          {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
          {extra !== undefined ? <div className={styles.extra}>{extra}</div> : null}
        </header>
      ) : null}
      <div className={styles.body}>{children}</div>
    </section>
  );
}

export default Card;
