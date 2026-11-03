import type { NextResponse } from 'next/server';
import type { z } from 'zod';

import { fail, ok } from './api-response';
import { requireAccount } from './auth-guard';
import { AppError } from './errors';

export interface HandlerContext {
  accountId: number;
  merchantId: number;
  request: Request;
  params: Record<string, string>;
}

/**
 * Next 15 passes dynamic route params as a Promise; unit tests may pass a plain
 * object or omit the context entirely.
 */
type RouteContext = { params?: Promise<Record<string, string>> | Record<string, string> };

async function resolveParams(context?: RouteContext): Promise<Record<string, string>> {
  if (!context?.params) {
    return {};
  }

  return context.params;
}

/** Authenticated route wrapper: resolves the session, then normalizes the result envelope. */
export function withAuth<T>(handler: (ctx: HandlerContext) => Promise<T>) {
  return async (request: Request, context?: RouteContext): Promise<NextResponse> => {
    try {
      const { accountId, merchantId } = await requireAccount();
      const params = await resolveParams(context);
      const data = await handler({ accountId, merchantId, request, params });

      return ok(data);
    } catch (error) {
      return fail(error);
    }
  };
}

/** Public route wrapper for the demo account used by the onboarding pages. */
export function withPublic<T>(handler: (ctx: HandlerContext) => Promise<T>) {
  return async (request: Request, context?: RouteContext): Promise<NextResponse> => {
    try {
      const params = await resolveParams(context);
      const data = await handler({ accountId: 1, merchantId: 1, request, params });

      return ok(data);
    } catch (error) {
      return fail(error);
    }
  };
}

/** Parses query string params, dropping empty values so optional numerics stay undefined. */
export function parseQuery<T>(request: Request, schema: z.ZodType<T>): T {
  const searchParams = new URL(request.url).searchParams;
  const raw: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    if (value !== '') {
      raw[key] = value;
    }
  }

  const result = schema.safeParse(raw);

  if (!result.success) {
    throw new AppError('INVALID_QUERY', 400, '查询参数不合法');
  }

  return result.data;
}

/** Parses a JSON body, mapping both JSON syntax errors and schema failures to INVALID_BODY. */
export async function parseBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new AppError('INVALID_BODY', 400, '请求体不合法');
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    throw new AppError('INVALID_BODY', 400, '请求体不合法');
  }

  return result.data;
}
