import { verifyServiceToken } from '@mtm/auth/service-token';
import type { ServiceTokenClaims } from '@mtm/auth/service-token';
import { createMiddleware } from 'hono/factory';

import { errorBody } from './http';
import type { AppEnv } from './http';

export type AuthVariables = { auth: ServiceTokenClaims };

/**
 * Mirrors `apps/ops-admin/lib/env.ts`'s production-secret guard: in production a
 * missing or placeholder (`change-me…`) secret is treated as a configuration
 * error instead of silently signing/verifying tokens.
 */
function isUnsafeProductionSecret(secret: string | undefined): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return false;
  }

  return !secret || secret.startsWith('change-me');
}

export const requireServiceToken = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const secret = process.env.CORE_API_JWT_SECRET;

  if (!secret || isUnsafeProductionSecret(secret)) {
    return c.json({ error: { code: 'CONFIGURATION_ERROR', message: '服务未正确配置', details: null } }, 500);
  }

  const header = c.req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  try {
    c.set('auth', await verifyServiceToken(token, secret));
  } catch {
    return c.json({ error: { code: 'UNAUTHORIZED', message: '未授权', details: null } }, 401);
  }

  await next();
});

export function requirePermission(code: string) {
  return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    if (!c.get('auth').permissions.includes(code)) {
      return c.json({ error: { code: 'FORBIDDEN', message: '无权访问', details: null } }, 403);
    }

    await next();
  });
}

function forbidden() {
  return errorBody('FORBIDDEN', '无权访问');
}

export function requireOpsPermission(code: string) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const auth = c.get('auth');

    if (auth.portal !== 'ops' || !auth.permissions.includes(code)) {
      return c.json(forbidden(), 403);
    }

    await next();
  });
}

export function requireMerchantPermission(code: string) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const auth = c.get('auth');

    if (auth.portal !== 'merchant' || !auth.permissions.includes(code)) {
      return c.json(forbidden(), 403);
    }

    await next();
  });
}

export function requireAnyPermission(codes: readonly string[]) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const auth = c.get('auth');

    if (!codes.some(code => auth.permissions.includes(code))) {
      return c.json(forbidden(), 403);
    }

    await next();
  });
}
