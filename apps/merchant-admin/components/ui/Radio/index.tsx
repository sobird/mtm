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
  /** Set false on all but one control in a group to render the error once. */
  showError?: boolean;
}

interface BoundRadioProps extends RadioProps {
  name: string;
  innerRef: Ref<HTMLInputElement>;
}

function BoundRadio({ name, innerRef, error, showError = true, className, label, id, ...rest }: BoundRadioProps) {
  const { register, getFieldState } = useFormContext();
  const formState = useFormState({ name });
  const { ref: registerRef, ...registration } = register(name);
  const message = showError
    ? (error ?? (getFieldState(name, formState).error?.message as string | undefined))
    : undefined;

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

function NativeRadio({
  innerRef,
  error,
  showError = true,
  className,
  label,
  ...rest
}: RadioProps & { innerRef: Ref<HTMLInputElement> }) {
  const message = showError ? error : undefined;

  return (
    <label className={cx(styles.wrapper, className)}>
      <input {...rest} ref={innerRef} type='radio' className={cx(styles.control, message && styles.invalid)} />
      {label ? <span className={styles.label}>{label}</span> : null}
      {message ? (
        <span role='alert' className={styles.error}>
          {message}
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
