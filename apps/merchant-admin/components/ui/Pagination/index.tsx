'use client';

import { useTranslations } from 'next-intl';

import { cx } from '../cx';

import styles from './Pagination.module.css';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const t = useTranslations('common');
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const current = Math.min(Math.max(1, page), pageCount);
  const canPrev = current > 1;
  const canNext = current < pageCount;

  return (
    <nav className={cx(styles.pagination, className)} aria-label={t('pagination')}>
      <span className={styles.total}>{t('totalItems', { value: total })}</span>
      <div className={styles.controls}>
        <button
          type='button'
          className={styles.button}
          aria-label={t('previousPage')}
          disabled={!canPrev}
          onClick={() => onPageChange(current - 1)}
        >
          {t('previousPage')}
        </button>
        <span className={styles.pageInfo} aria-current='page'>
          {t('pageInfo', { current, pageCount })}
        </span>
        <button
          type='button'
          className={styles.button}
          aria-label={t('nextPage')}
          disabled={!canNext}
          onClick={() => onPageChange(current + 1)}
        >
          {t('nextPage')}
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
