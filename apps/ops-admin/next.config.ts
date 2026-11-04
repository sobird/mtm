import path from 'node:path';

import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Trace from the monorepo root so the standalone bundle keeps the workspace
  // layout the Docker images expect (`apps/<app>/server.js`).
  outputFileTracingRoot: path.resolve(process.cwd(), '../..'),
  reactStrictMode: true,
  transpilePackages: ['@mtm/ui', '@mtm/i18n', '@mtm/auth', '@mtm/contracts'],
  // Argon2 ships a native binding: keep it external so webpack does not try to
  // parse the `.node` file. `@mtm/auth` is transpiled, so the app declares this
  // dependency itself to keep the request resolvable at build and runtime.
  serverExternalPackages: ['@node-rs/argon2'],
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withNextIntl(nextConfig);
