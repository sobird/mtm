'use client';

import { forwardRef, useCallback } from 'react';
import type { Ref } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';

import { cx } from '../cx';
import { assignRef } from '../refs';

import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Explicit error message; takes precedence over the form field error. */
  error?: string;
}

interface BoundInputProps extends InputProps {
  name: string;
  innerRef: Ref<HTMLInputElement>;
}

function BoundInput({ name, innerRef, error, className, id, ...rest }: BoundInputProps) {
  const { register, getFieldState } = useFormContext();
  const formState = useFormState({ name });
  const { ref: registerRef, ...registration } = register(name);
  const message = error ?? (getFieldState(name, formState).error?.message as string | undefined);

  const mergedRef = useCallback(
    (node: HTMLInputElement | null) => {
      assignRef(innerRef, node);
      assignRef(registerRef, node);
    },
    [innerRef, registerRef]
  );

  return (
    <>
      <input
        id={id}
        name={name}
        {...registration}
        {...rest}
        ref={mergedRef}
        aria-invalid={message ? true : undefined}
        className={cx(styles.input, message && styles.invalid, className)}
      />
      {message ? (
        <p role='alert' className={styles.error}>
          {message}
        </p>
      ) : null}
    </>
  );
}

function NativeInput({ innerRef, error, className, ...rest }: InputProps & { innerRef: Ref<HTMLInputElement> }) {
  return (
    <>
      <input
        {...rest}
        ref={innerRef}
        aria-invalid={error ? true : undefined}
        className={cx(styles.input, error && styles.invalid, className)}
      />
      {error ? (
        <p role='alert' className={styles.error}>
          {error}
        </p>
      ) : null}
    </>
  );
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  const methods = useFormContext();
  const isFormBound = Boolean(methods && props.name && props.value === undefined && props.onChange === undefined);

  if (isFormBound) {
    return <BoundInput {...props} name={props.name as string} innerRef={ref} />;
  }

  return <NativeInput {...props} innerRef={ref} />;
});

export default Input;
