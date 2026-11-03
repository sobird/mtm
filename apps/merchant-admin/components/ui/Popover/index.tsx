'use client';

import { Popover as BasePopover } from '@base-ui-components/react/popover';
import { isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';

import styles from './Popover.module.css';

export interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({ trigger, children, open, onOpenChange }: PopoverProps) {
  const triggerElement = (isValidElement(trigger) ? trigger : <button type='button'>{trigger}</button>) as ReactElement<
    Record<string, unknown>
  >;

  return (
    <BasePopover.Root open={open} onOpenChange={onOpenChange ? next => onOpenChange(next) : undefined}>
      <BasePopover.Trigger render={triggerElement} />
      <BasePopover.Portal>
        <BasePopover.Positioner sideOffset={6} className={styles.positioner}>
          <BasePopover.Popup className={styles.popup}>{children}</BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}

export default Popover;
