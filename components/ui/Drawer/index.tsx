'use client';

import { Dialog as BaseDialog } from '@base-ui-components/react/dialog';
import type { ReactNode } from 'react';

import { cx } from '../cx';

import styles from './Drawer.module.css';

export type DrawerSide = 'right' | 'left';

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  side?: DrawerSide;
  className?: string;
}

export function Drawer({ open, onOpenChange, title, children, footer, side = 'right', className }: DrawerProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={styles.backdrop} />
        <BaseDialog.Popup className={cx(styles.popup, styles[side], className)}>
          <header className={styles.header}>
            {title !== undefined ? <BaseDialog.Title className={styles.title}>{title}</BaseDialog.Title> : <span />}
            <BaseDialog.Close className={styles.close} aria-label='关闭'>
              ×
            </BaseDialog.Close>
          </header>
          <div className={styles.body}>{children}</div>
          {footer !== undefined ? <footer className={styles.footer}>{footer}</footer> : null}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

export default Drawer;
