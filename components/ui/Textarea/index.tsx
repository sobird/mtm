'use client';

import { forwardRef, useCallback } from 'react';
import type { Ref } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';

import { cx } from '../cx';
import { assignRef } from '../refs';

import styles from './Textarea.module.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Explicit error message; takes precedence over the form field error. */
  error?: string;
}

interface BoundTextareaProps extends TextareaProps {
  name: string;
  innerRef: Ref<HTMLTextAreaElement>;
}

function BoundTextarea({ name, innerRef, error, className, id, ...rest }: BoundTextareaProps) {
  const { register } = useFormContext();
  const { errors } = useFormState({ name });
  const { ref: registerRef, ...registration } = register(name);
  const message = error ?? (errors[name]?.message as string | undefined);

  const mergedRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      assignRef(innerRef, node);
      assignRef(registerRef, node);
    },
    [innerRef, registerRef]
  );

  return (
    <>
      <textarea
        id={id}
        name={name}
        {...registration}
        {...rest}
        ref={mergedRef}
        aria-invalid={message ? true : undefined}
        className={cx(styles.textarea, message && styles.invalid, className)}
      />
      {message ? (
        <p role='alert' className={styles.error}>
          {message}
        </p>
      ) : null}
    </>
  );
}

function NativeTextarea({
  innerRef,
  error,
  className,
  ...rest
}: TextareaProps & { innerRef: Ref<HTMLTextAreaElement> }) {
  return (
    <>
      <textarea
        {...rest}
        ref={innerRef}
        aria-invalid={error ? true : undefined}
        className={cx(styles.textarea, error && styles.invalid, className)}
      />
      {error ? (
        <p role='alert' className={styles.error}>
          {error}
        </p>
      ) : null}
    </>
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(props, ref) {
  const methods = useFormContext();
  const isFormBound = Boolean(methods && props.name && props.value === undefined && props.onChange === undefined);

  if (isFormBound) {
    return <BoundTextarea {...props} name={props.name as string} innerRef={ref} />;
  }

  return <NativeTextarea {...props} innerRef={ref} />;
});

export default Textarea;
