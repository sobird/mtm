import type { ServiceTokenClaims } from '@mtm/auth/service-token';
import { PERMISSIONS } from '@mtm/contracts';
import type { PageMeta } from '@mtm/contracts';
import type { Context, Env } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import type { AuthVariables } from './auth';

export type AppEnv = { Variables: AuthVariables };

export interface ErrorBody {
  error: { code: string; message: string; details: unknown };
}

export class HttpError extends Error {
  readonly code: string;
  readonly status: ContentfulStatusCode;
  readonly details?: unknown;

  constructor(code: string, status: ContentfulStatusCode, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function errorBody(code: string, message: string, details?: unknown): ErrorBody {
  return { error: { code, message, details: details ?? null } };
}

export function sendData<E extends Env>(c: Context<E>, data: unknown, status: ContentfulStatusCode = 200) {
  return c.json({ data }, status);
}

export function sendPage<E extends Env>(c: Context<E>, items: unknown[], meta: PageMeta) {
  return c.json({ data: items, meta }, 200);
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

export function normalizePage(query: PageQuery): { page: number; pageSize: number; skip: number; take: number } {
  const rawPage = query.page ?? 1;
  const rawPageSize = query.pageSize ?? 20;
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.trunc(rawPage)) : 1;
  const pageSize = Number.isFinite(rawPageSize) ? Math.min(100, Math.max(1, Math.trunc(rawPageSize))) : 20;

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function canAccessMerchant(auth: ServiceTokenClaims, merchantId: string): boolean {
  if (auth.portal === 'merchant') {
    return auth.merchantId === merchantId;
  }

  if (auth.permissions.includes(PERMISSIONS.PLATFORM_CROSS_TENANT) || auth.merchantScope === null) {
    return true;
  }

  return auth.merchantScope.includes(merchantId);
}

export function assertMerchantVisible(auth: ServiceTokenClaims, merchantId: string): void {
  if (!canAccessMerchant(auth, merchantId)) {
    throw new HttpError('FORBIDDEN', 403, '无权访问该商家');
  }
}
