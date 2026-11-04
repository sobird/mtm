import { defineConfig } from 'vitest/config';

export default defineConfig({
  // tsconfig uses `jsx: preserve`; Vitest must compile JSX itself.
  oxc: { jsx: { runtime: 'automatic', importSource: 'react' } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // Styles are irrelevant in jsdom.
    css: false,
  },
});
