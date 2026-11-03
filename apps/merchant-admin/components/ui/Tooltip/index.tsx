'use client';

import { Tooltip as BaseTooltip } from '@base-ui-components/react/tooltip';
import { isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';

import styles from './Tooltip.module.css';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const trigger = (isValidElement(children) ? children : <button type='button'>{children}</button>) as ReactElement<
    Record<string, unknown>
  >;

  return (
    <BaseTooltip.Provider delay={200}>
      <BaseTooltip.Root>
        <BaseTooltip.Trigger render={trigger} />
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner sideOffset={6} className={styles.positioner}>
            <BaseTooltip.Popup className={styles.popup}>{content}</BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}

export default Tooltip;
