import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  // tsconfig uses `jsx: preserve` for Next.js; Vitest must compile JSX itself.
  oxc: { jsx: { runtime: 'automatic', importSource: 'react' } },
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // Styles are irrelevant in jsdom.
    css: false,
  },
});
