import type { Ref } from 'react';

/** Assign a value to either a callback ref or a mutable ref object. */
export function assignRef<T>(ref: Ref<T> | null | undefined, value: T | null): void {
  if (!ref) {
    return;
  }
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  (ref as { current: T | null }).current = value;
}
