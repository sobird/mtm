import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@mtm/ui', '@mtm/auth', '@mtm/contracts'],
};

export default nextConfig;
