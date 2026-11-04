import { randomBytes } from 'node:crypto';

const DEFAULT_RANDOM = () => randomBytes(32).toString('hex');

export function buildDockerEnv(existing, env = {}) {
  if (existing) return existing;
  const random = env.RANDOM ?? DEFAULT_RANDOM;
  return [
    'MERCHANT_DATABASE_URL=postgresql://mtm:mtm@postgres:5432/commerce_merchant?schema=public',
    'CORE_DATABASE_URL=postgresql://mtm:mtm@postgres:5432/commerce_core?schema=public',
    'OPS_DATABASE_URL=postgresql://mtm:mtm@postgres:5432/commerce_ops?schema=public',
    `AUTH_SECRET=${random()}`,
    `OPS_AUTH_SECRET=${random()}`,
    `CORE_API_JWT_SECRET=${random()}`,
    'CORE_API_URL=http://core-api:4000',
    'CORE_PUBLIC_URL=http://localhost:4000',
    'UPLOAD_DIR=/data/uploads',
    'UPLOAD_MAX_BYTES=10485760',
    'AUTH_COOKIE_SECURE=false',
    'SEED_DEMO_DATA=true',
    '',
  ].join('\n');
}
