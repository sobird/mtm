'use client';

import { useTranslations } from 'next-intl';
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
  const t = useTranslations();
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleReset = (event: FormEvent<HTMLFormElement>) => {
    // Without a controller-owned reset, let the native reset clear uncontrolled fields.
    if (!onReset) {
      return;
    }
    event.preventDefault();
    onReset();
  };

  return (
    <form className={cx(styles.form, className)} onSubmit={handleSubmit} onReset={handleReset}>
      <div className={styles.fields}>{children}</div>
      <div className={styles.actions}>
        <Button type='submit' size='md'>
          {t('common.search')}
        </Button>
        <Button type='reset' size='md' variant='secondary'>
          {t('common.reset')}
        </Button>
      </div>
    </form>
  );
}

export default SearchForm;
