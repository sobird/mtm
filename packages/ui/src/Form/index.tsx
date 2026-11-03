'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { z } from 'zod';

import { cx } from '../cx';

import styles from './Form.module.css';

export { EMPTY_FORM_FIELD_STATE, useFormField } from './useFormField';
export type { FormFieldState } from './useFormField';

export interface FormProps<TSchema extends z.ZodTypeAny> extends Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  'onSubmit' | 'children'
> {
  schema: TSchema;
  defaultValues?: Partial<z.input<TSchema>>;
  onSubmit: (values: z.output<TSchema>, event?: React.BaseSyntheticEvent) => void | Promise<void>;
  children: ReactNode;
}

export function Form<TSchema extends z.ZodTypeAny>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
  ...rest
}: FormProps<TSchema>) {
  const methods = useForm({
    resolver: zodResolver(schema as never) as never,
    defaultValues: defaultValues as never,
  });

  return (
    <FormProvider {...methods}>
      <form
        {...rest}
        noValidate
        className={cx(styles.form, className)}
        onSubmit={methods.handleSubmit(onSubmit as never)}
      >
        {children}
      </form>
    </FormProvider>
  );
}

export default Form;
