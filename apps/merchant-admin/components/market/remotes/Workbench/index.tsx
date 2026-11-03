'use client';

import type { CSSProperties } from 'react';

import { DashboardGrid, DashboardGridItem } from '@/components/dashboard/DashboardGrid';
import { cx } from '@/components/ui/cx';

import Overview from '../Overview';
import Realdata from '../Realdata';

import styles from './Workbench.module.css';

export interface WorkbenchProps {
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}

export function Workbench({ className, style, bodyStyle }: WorkbenchProps) {
  return (
    <div className={cx(styles.region, className)} style={style}>
      <DashboardGrid>
        <DashboardGridItem span={24}>
          <Overview bodyStyle={bodyStyle} />
        </DashboardGridItem>
        <DashboardGridItem span={12}>
          <Realdata bodyStyle={bodyStyle} />
        </DashboardGridItem>
      </DashboardGrid>
    </div>
  );
}

export default Workbench;
