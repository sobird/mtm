'use client';

import { Menu } from '@base-ui-components/react/menu';
import { isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { cx } from '../cx';

import styles from './Dropdown.module.css';

export interface DropdownItem {
  key: string;
  label: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  className?: string;
}

export function Dropdown({ trigger, items, className }: DropdownProps) {
  const triggerElement = (isValidElement(trigger) ? trigger : <button type='button'>{trigger}</button>) as ReactElement<
    Record<string, unknown>
  >;

  return (
    <Menu.Root>
      <Menu.Trigger render={triggerElement} />
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} className={styles.positioner}>
          <Menu.Popup className={cx(styles.popup, className)}>
            {items.map(item => (
              <Menu.Item
                key={item.key}
                className={cx(styles.item, item.danger && styles.danger)}
                onClick={item.onClick}
              >
                {item.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export default Dropdown;
