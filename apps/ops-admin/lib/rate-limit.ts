import { createLoginRateLimiter } from '@mtm/auth/rate-limit';

/** Shared limiter for ops username/password logins. */
export const opsLoginLimiter = createLoginRateLimiter();
