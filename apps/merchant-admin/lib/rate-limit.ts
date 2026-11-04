import { createLoginRateLimiter } from '@mtm/auth/rate-limit';

/** Shared limiter for merchant username/password logins. */
export const merchantLoginLimiter = createLoginRateLimiter();
