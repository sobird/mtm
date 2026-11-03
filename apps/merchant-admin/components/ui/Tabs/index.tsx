'use client';

import { Tabs as BaseTabs } from '@base-ui-components/react/tabs';
import type { ReactNode } from 'react';

import { cx } from '../cx';

import styles from './Tabs.module.css';

export interface TabItem {
  key: string;
  label: ReactNode;
  children: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export function Tabs({ items, value, defaultValue, onChange, className }: TabsProps) {
  return (
    <BaseTabs.Root
      value={value}
      defaultValue={defaultValue ?? (value === undefined ? items[0]?.key : undefined)}
      onValueChange={next => onChange?.(String(next))}
      className={cx(styles.tabs, className)}
    >
      <BaseTabs.List className={styles.list}>
        {items.map(item => (
          <BaseTabs.Tab key={item.key} value={item.key} disabled={item.disabled} className={styles.tab}>
            {item.label}
          </BaseTabs.Tab>
        ))}
      </BaseTabs.List>
      {items.map(item => (
        <BaseTabs.Panel key={item.key} value={item.key} className={styles.panel}>
          {item.children}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  );
}

export default Tabs;
