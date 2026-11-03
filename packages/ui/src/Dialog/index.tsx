'use client';

import { Dialog as BaseDialog } from '@base-ui-components/react/dialog';
import type { ReactNode } from 'react';

import { cx } from '../cx';

import styles from './Dialog.module.css';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, title, description, children, footer, className }: DialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={styles.backdrop} />
        <BaseDialog.Popup className={cx(styles.popup, className)}>
          <header className={styles.header}>
            <BaseDialog.Title className={styles.title}>{title}</BaseDialog.Title>
            <BaseDialog.Close className={styles.close} aria-label='关闭'>
              ×
            </BaseDialog.Close>
          </header>
          {description !== undefined ? (
            <BaseDialog.Description className={styles.description}>{description}</BaseDialog.Description>
          ) : null}
          <div className={styles.body}>{children}</div>
          {footer !== undefined ? <footer className={styles.footer}>{footer}</footer> : null}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

export default Dialog;
