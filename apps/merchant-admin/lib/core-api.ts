import { signServiceToken } from '@mtm/auth/service-token';

import { fail, ok } from './api-response';
import { auth } from './auth';
import { requireAccount } from './auth-guard';
import { AppError } from './errors';
import { assertSameOrigin } from './handler';
import { getAccountPermissions } from './services/permission';

const DEFAULT_CORE_API_URL = 'http://localhost:4000';
const ALLOWED_PATH = /^[a-zA-Z0-9/_-]+$/;
const FETCH_TIMEOUT_MS = 5_000;
const DEFAULT_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
const MULTIPART_OVERHEAD_BYTES = 1024 * 1024;

/** Rejects obviously oversized multipart bodies from the declared header. */
function assertDeclaredMultipartSize(contentLength: string | null): void {
  if (contentLength === null || contentLength === '') {
    return;
  }

  const declared = Number(contentLength);
  const maxBytes = Number(process.env.UPLOAD_MAX_BYTES) || DEFAULT_UPLOAD_MAX_BYTES;

  if (Number.isFinite(declared) && declared > maxBytes + MULTIPART_OVERHEAD_BYTES) {
    throw new AppError('UPLOAD_TOO_LARGE', 413, '上传文件过大');
  }
}

/** Mirrors `lib/env.ts`'s production-secret guard for the core-api token. */
function isUnsafeProductionSecret(secret: string | undefined): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return false;
  }

  return !secret || secret.startsWith('change-me');
}

function isTimeoutError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const { name } = error as { name?: unknown };

  return name === 'TimeoutError' || name === 'AbortError';
}

export interface CoreApiInit {
  method?: string;
  body?: unknown;
  formData?: FormData;
  search?: string;
}

interface CoreApiPayload<T> {
  data?: T;
  error?: { code?: string; message?: string };
}

/** Signs a short-lived service token describing the current merchant account. */
export async function buildServiceToken(): Promise<string> {
  const secret = process.env.CORE_API_JWT_SECRET;

  if (!secret || isUnsafeProductionSecret(secret)) {
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

  let response: Response;

  try {
    response = await fetch(url, {
      method: init.method ?? 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        // FormData must be sent untouched so fetch can set the multipart boundary.
        ...(init.formData === undefined && init.body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      body:
        init.formData !== undefined ? init.formData : init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new AppError('CORE_API_TIMEOUT', 504, '核心服务响应超时');
    }

    throw error;
  }

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
    assertSameOrigin(request);
    await requireAccount();

    const joined = segments.join('/');

    if (!joined || !ALLOWED_PATH.test(joined)) {
      throw new AppError('INVALID_PATH', 400, '路径不合法');
    }

    const method = request.method.toUpperCase();
    const contentType = request.headers.get('content-type') ?? '';
    let body: unknown;
    let formData: FormData | undefined;

    if (method !== 'GET' && method !== 'HEAD') {
      if (contentType.startsWith('multipart/form-data')) {
        // Reject oversized bodies before buffering them into memory.
        assertDeclaredMultipartSize(request.headers.get('content-length'));
        // Never read multipart bodies as text: that would drop the boundary.
        formData = await request.formData();
      } else {
        const text = await request.text();

        if (text) {
          try {
            body = JSON.parse(text);
          } catch {
            throw new AppError('INVALID_BODY', 400, '请求体不合法');
          }
        }
      }
    }

    const search = new URL(request.url).searchParams.toString();
    const data = await callCoreApi<unknown>(`/${joined}`, { method, body, formData, search });

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
