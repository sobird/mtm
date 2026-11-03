import { cx } from '../cx';

import styles from './Skeleton.module.css';

export interface SkeletonProps {
  rows?: number;
  className?: string;
}

export function Skeleton({ rows = 1, className }: SkeletonProps) {
  return (
    <div className={cx(styles.skeleton, className)} aria-busy='true' aria-live='polite'>
      {Array.from({ length: Math.max(1, rows) }, (_, index) => (
        <span key={index} className={styles.bar} />
      ))}
    </div>
  );
}

export default Skeleton;
