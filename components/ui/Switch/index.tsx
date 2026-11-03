'use client';

import { forwardRef, useCallback } from 'react';
import type { ReactNode, Ref } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';

import { cx } from '../cx';
import { assignRef } from '../refs';

import styles from './Switch.module.css';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  /** Explicit error message; takes precedence over the form field error. */
  error?: string;
}

interface BoundSwitchProps extends SwitchProps {
  name: string;
  innerRef: Ref<HTMLInputElement>;
}

function BoundSwitch({ name, innerRef, error, className, label, id, ...rest }: BoundSwitchProps) {
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
        type='checkbox'
        aria-invalid={message ? true : undefined}
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

function NativeSwitch({
  innerRef,
  error,
  className,
  label,
  ...rest
}: SwitchProps & { innerRef: Ref<HTMLInputElement> }) {
  return (
    <label className={cx(styles.wrapper, className)}>
      <input
        {...rest}
        ref={innerRef}
        type='checkbox'
        aria-invalid={error ? true : undefined}
        className={cx(styles.control, error && styles.invalid)}
      />
      {label ? <span className={styles.label}>{label}</span> : null}
      {error ? (
        <span role='alert' className={styles.error}>
          {error}
        </span>
      ) : null}
    </label>
  );
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(props, ref) {
  const methods = useFormContext();
  const isFormBound = Boolean(methods && props.name && props.checked === undefined && props.onChange === undefined);

  if (isFormBound) {
    return <BoundSwitch {...props} name={props.name as string} innerRef={ref} />;
  }

  return <NativeSwitch {...props} innerRef={ref} />;
});

export default Switch;
