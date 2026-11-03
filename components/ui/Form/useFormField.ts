'use client';

import { useFormContext } from 'react-hook-form';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

export interface FormFieldState<TValues extends FieldValues = FieldValues> {
  error: string | undefined;
  disabled: boolean;
  isSubmitting: boolean;
  register: UseFormReturn<TValues>['register'];
  setValue: UseFormReturn<TValues>['setValue'];
  watch: UseFormReturn<TValues>['watch'];
  control: UseFormReturn<TValues>['control'];
}

const emptyRegister = (() => ({})) as unknown as UseFormReturn['register'];
const emptySetValue = (() => undefined) as unknown as UseFormReturn['setValue'];
const emptyWatch = (() => undefined) as unknown as UseFormReturn['watch'];

/** Stable defaults returned outside a Form or without a field name. */
export const EMPTY_FORM_FIELD_STATE: FormFieldState = {
  error: undefined,
  disabled: false,
  isSubmitting: false,
  register: emptyRegister,
  setValue: emptySetValue,
  watch: emptyWatch,
  control: undefined as unknown as UseFormReturn['control'],
};

/**
 * Read form field state for custom controls.
 *
 * The optional `name` scopes the error lookup. Without a Form context (or a
 * name) it returns stable defaults so the hook is safe in standalone controls.
 * Note: this hook does not subscribe to form-state changes; controls that need
 * to re-render on error/disabled updates should use RHF's `useFormState` /
 * `useWatch` directly.
 */
export function useFormField<TValues extends FieldValues = FieldValues>(name?: string): FormFieldState<TValues> {
  const methods = useFormContext<TValues>();

  if (!methods || !name) {
    return EMPTY_FORM_FIELD_STATE as FormFieldState<TValues>;
  }

  const fieldError = methods.formState.errors[name];

  return {
    error: fieldError?.message as string | undefined,
    disabled: Boolean(methods.formState.isSubmitting),
    isSubmitting: Boolean(methods.formState.isSubmitting),
    register: methods.register,
    setValue: methods.setValue,
    watch: methods.watch,
    control: methods.control,
  };
}
