import type { ReactNode } from 'react';

import { cx } from '../cx';

import styles from './Field.module.css';

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({ label, error, hint, required, children, className, ...rest }: FieldProps) {
  return (
    <div className={cx(styles.field, className)} {...rest}>
      {label ? (
        <span className={styles.label}>
          {label}
          {required ? (
            <span className={styles.required} aria-hidden='true'>
              *
            </span>
          ) : null}
        </span>
      ) : null}
      {children}
      {hint ? <p className={styles.hint}>{hint}</p> : null}
      {error ? (
        <p role='alert' className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default Field;
