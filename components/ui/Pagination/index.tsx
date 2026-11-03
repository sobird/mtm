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
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const current = Math.min(Math.max(1, page), pageCount);
  const canPrev = current > 1;
  const canNext = current < pageCount;

  return (
    <nav className={cx(styles.pagination, className)} aria-label='分页'>
      <span className={styles.total}>共 {total} 条</span>
      <div className={styles.controls}>
        <button
          type='button'
          className={styles.button}
          aria-label='上一页'
          disabled={!canPrev}
          onClick={() => onPageChange(current - 1)}
        >
          上一页
        </button>
        <span className={styles.pageInfo} aria-current='page'>
          第 {current} / {pageCount} 页
        </span>
        <button
          type='button'
          className={styles.button}
          aria-label='下一页'
          disabled={!canNext}
          onClick={() => onPageChange(current + 1)}
        >
          下一页
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
