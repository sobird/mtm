/** Fails fast when production runs with a missing or placeholder secret. */
export function assertProductionSecret(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.startsWith('change-me')) {
    throw new Error('AUTH_SECRET must be set to a strong random value in production');
  }
}
