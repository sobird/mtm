import type { CSSProperties, ReactNode } from 'react';

import { cx } from '@/components/ui/cx';

import styles from './DashboardGrid.module.css';

export interface DashboardGridProps {
  children: ReactNode;
  className?: string;
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return <div className={cx(styles.grid, className)}>{children}</div>;
}

export interface DashboardGridItemProps {
  span?: number;
  children: ReactNode;
  className?: string;
}

export function DashboardGridItem({ span = 24, children, className }: DashboardGridItemProps) {
  const normalized = Math.min(24, Math.max(1, Math.round(span)));
  const style = { '--dashboard-grid-span': String(normalized) } as CSSProperties;

  return (
    <div className={cx(styles.item, className)} style={style}>
      {children}
    </div>
  );
}

export default DashboardGrid;
