/**
 * Fails fast when production runs with a missing or placeholder secret.
 *
 * Auth.js only auto-reads `AUTH_SECRET`, so every ops-specific secret (starting
 * with `OPS_AUTH_SECRET`) is passed explicitly and validated here. Keep this
 * module Edge-safe: middleware imports it, so no Node-only APIs.
 */
export function assertProductionSecret(name: string): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const secret = process.env[name];

  if (!secret || secret.startsWith('change-me')) {
    throw new Error(`${name} must be set to a strong random value in production`);
  }
}
