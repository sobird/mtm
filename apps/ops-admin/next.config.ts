import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@mtm/ui', '@mtm/i18n', '@mtm/auth', '@mtm/contracts'],
  // Argon2 ships a native binding: keep it external so webpack does not try to
  // parse the `.node` file. `@mtm/auth` is transpiled, so the app declares this
  // dependency itself to keep the request resolvable at build and runtime.
  serverExternalPackages: ['@node-rs/argon2'],
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withNextIntl(nextConfig);
