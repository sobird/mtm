'use client';

import { forwardRef, useCallback } from 'react';
import type { ReactNode, Ref } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';

import { cx } from '../cx';
import { assignRef } from '../refs';

import styles from './Radio.module.css';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  /** Explicit error message; takes precedence over the form field error. */
  error?: string;
}

interface BoundRadioProps extends RadioProps {
  name: string;
  innerRef: Ref<HTMLInputElement>;
}

function BoundRadio({ name, innerRef, error, className, label, id, ...rest }: BoundRadioProps) {
  const { register } = useFormContext();
  const { errors } = useFormState({ name });
  const { ref: registerRef, ...registration } = register(name);
  const message = error ?? (errors[name]?.message as string | undefined);

  const mergedRef = useCallback(
    (node: HTMLInputElement | null) => {
      assignRef(innerRef, node);
      assignRef(registerRef, node);
    },
    [innerRef, registerRef]
  );

  return (
    <label className={cx(styles.wrapper, className)}>
      <input
        id={id}
        name={name}
        {...registration}
        {...rest}
        ref={mergedRef}
        type='radio'
        className={cx(styles.control, message && styles.invalid)}
      />
      {label ? <span className={styles.label}>{label}</span> : null}
      {message ? (
        <span role='alert' className={styles.error}>
          {message}
        </span>
      ) : null}
    </label>
  );
}

function NativeRadio({ innerRef, error, className, label, ...rest }: RadioProps & { innerRef: Ref<HTMLInputElement> }) {
  return (
    <label className={cx(styles.wrapper, className)}>
      <input {...rest} ref={innerRef} type='radio' className={cx(styles.control, error && styles.invalid)} />
      {label ? <span className={styles.label}>{label}</span> : null}
      {error ? (
        <span role='alert' className={styles.error}>
          {error}
        </span>
      ) : null}
    </label>
  );
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(props, ref) {
  const methods = useFormContext();
  const isFormBound = Boolean(methods && props.name && props.checked === undefined && props.onChange === undefined);

  if (isFormBound) {
    return <BoundRadio {...props} name={props.name as string} innerRef={ref} />;
  }

  return <NativeRadio {...props} innerRef={ref} />;
});

export default Radio;
