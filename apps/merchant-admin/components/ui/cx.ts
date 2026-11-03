/**
 * Minimal className builder. CSS module maps may be empty in tests
 * (Vitest runs with `css: false`), so every value is optional.
 */
export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
