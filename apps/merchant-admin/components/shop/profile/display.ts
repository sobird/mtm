/** Formats a possibly-missing profile value for display. */
export function display(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '--';
  }

  return String(value);
}
