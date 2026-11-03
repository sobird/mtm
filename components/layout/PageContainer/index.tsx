import type { ReactNode } from 'react';

import { Breadcrumbs } from '../Breadcrumbs';
import type { BreadcrumbItem } from '../Breadcrumbs';

import styles from './PageContainer.module.css';

export interface PageContainerProps {
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageContainer({ title, description, breadcrumbs, actions, children, className }: PageContainerProps) {
  return (
    <div className={`${styles.page} ${className ?? ''}`}>
      {breadcrumbs && breadcrumbs.length > 0 ? <Breadcrumbs items={breadcrumbs} /> : null}

      <header className={styles.header}>
        <div className={styles.heading}>
          <h1 className={styles.title}>{title}</h1>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>

      <div className={styles.content}>{children}</div>
    </div>
  );
}

export default PageContainer;
