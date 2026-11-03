import { signServiceToken } from '@mtm/auth/service-token';

import { fail, ok } from './api-response';
import { auth } from './auth';
import { requireAccount } from './auth-guard';
import { AppError } from './errors';
import { getAccountPermissions } from './services/permission';

const DEFAULT_CORE_API_URL = 'http://localhost:4000';
const ALLOWED_PATH = /^[a-zA-Z0-9/_-]+$/;

export interface CoreApiInit {
  method?: string;
  body?: unknown;
  search?: string;
}

interface CoreApiPayload<T> {
  data?: T;
  error?: { code?: string; message?: string };
}

/** Signs a short-lived service token describing the current merchant account. */
export async function buildServiceToken(): Promise<string> {
  const secret = process.env.CORE_API_JWT_SECRET;

  if (!secret) {
    throw new AppError('CONFIGURATION_ERROR', 500, '核心服务未配置');
  }

  const session = await auth();

  if (!session?.user?.accountId) {
    throw new AppError('UNAUTHORIZED', 401, '未登录');
  }

  const snapshot = await getAccountPermissions(session.user.accountId);

  return signServiceToken(
    {
      portal: 'merchant',
      userId: session.user.accountId,
      merchantId: session.user.merchantId,
      permissions: snapshot.codes,
      merchantScope: null,
    },
    secret
  );
}

/** Calls core-api with the current account's service token and unwraps `data`. */
export async function callCoreApi<T>(path: string, init: CoreApiInit = {}): Promise<T> {
  const token = await buildServiceToken();
  const base = process.env.CORE_API_URL ?? DEFAULT_CORE_API_URL;
  const url = `${base}/api/v1${path}${init.search ? `?${init.search}` : ''}`;

  const response = await fetch(url, {
    method: init.method ?? 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      ...(init.body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => null)) as CoreApiPayload<T> | null;

  if (!response.ok) {
    const code = payload?.error?.code ?? 'CORE_API_ERROR';
    throw new AppError(code, response.status, payload?.error?.message ?? '核心服务调用失败');
  }

  return payload?.data as T;
}

/** Same-origin proxy: authenticates the browser session then forwards to core-api. */
export async function proxyToCoreApi(request: Request, segments: string[]): Promise<Response> {
  try {
    await requireAccount();

    const joined = segments.join('/');

    if (!joined || !ALLOWED_PATH.test(joined)) {
      throw new AppError('INVALID_PATH', 400, '路径不合法');
    }

    const method = request.method.toUpperCase();
    let body: unknown;

    if (method !== 'GET' && method !== 'HEAD') {
      const text = await request.text();

      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          throw new AppError('INVALID_BODY', 400, '请求体不合法');
        }
      }
    }

    const search = new URL(request.url).searchParams.toString();
    const data = await callCoreApi<unknown>(`/${joined}`, { method, body, search });

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
