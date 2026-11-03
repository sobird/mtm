'use client';

import { Button } from '@/components/ui';
import type { ButtonVariant } from '@/components/ui';
import { cx } from '@/components/ui/cx';

import styles from './ButtonTab.module.css';

export interface ButtonTabItem {
  key: string;
  text: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  onClick?: () => void;
}

export interface ButtonTabProps {
  items: ButtonTabItem[];
  className?: string;
}

/** Reusable row of action buttons, ported from the legacy trademark `button-tab`. */
export function ButtonTab({ items, className }: ButtonTabProps) {
  return (
    <div className={cx(styles.bar, className)}>
      {items.map(item => (
        <Button key={item.key} variant={item.variant} disabled={item.disabled} onClick={item.onClick}>
          {item.text}
        </Button>
      ))}
    </div>
  );
}

export default ButtonTab;
