'use client';

import { Dialog as BaseDialog } from '@base-ui-components/react/dialog';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { cx } from '../cx';

import styles from './Drawer.module.css';

export type DrawerSide = 'right' | 'left';

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  /** Accessible name used when `title` is omitted. */
  ariaLabel?: string;
  children?: ReactNode;
  footer?: ReactNode;
  side?: DrawerSide;
  className?: string;
}

export function Drawer({
  open,
  onOpenChange,
  title,
  ariaLabel,
  children,
  footer,
  side = 'right',
  className,
}: DrawerProps) {
  const t = useTranslations();

  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={styles.backdrop} />
        <BaseDialog.Popup
          aria-label={title === undefined ? (ariaLabel ?? t('common.drawer')) : undefined}
          className={cx(styles.popup, styles[side], className)}
        >
          <header className={styles.header}>
            {title !== undefined ? <BaseDialog.Title className={styles.title}>{title}</BaseDialog.Title> : <span />}
            <BaseDialog.Close className={styles.close} aria-label={t('common.close')}>
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
