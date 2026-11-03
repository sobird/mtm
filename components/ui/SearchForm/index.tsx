'use client';

import type { FormEvent, ReactNode } from 'react';

import { Button } from '../Button';
import { cx } from '../cx';

import styles from './SearchForm.module.css';

export interface SearchFormProps {
  children: ReactNode;
  onSubmit: () => void;
  onReset?: () => void;
  className?: string;
}

export function SearchForm({ children, onSubmit, onReset, className }: SearchFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleReset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onReset?.();
  };

  return (
    <form className={cx(styles.form, className)} onSubmit={handleSubmit} onReset={handleReset}>
      <div className={styles.fields}>{children}</div>
      <div className={styles.actions}>
        <Button type='submit' size='md'>
          查询
        </Button>
        <Button type='reset' size='md' variant='secondary'>
          重置
        </Button>
      </div>
    </form>
  );
}

export default SearchForm;
