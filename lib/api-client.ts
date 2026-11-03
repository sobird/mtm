export class ApiError extends Error {
  readonly code: string;

  readonly status: number;

  constructor(code: string, status: number, message: string = code) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export type ApiFetchInit = Omit<RequestInit, 'body'> & {
  query?: Record<string, unknown>;
  body?: unknown;
};

interface ApiEnvelope<T> {
  code: number | string;
  message: string;
  data: T;
}

function buildUrl(path: string, query?: Record<string, unknown>): string {
  if (!query) {
    return path;
  }

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    search.append(key, String(value));
  }

  const queryString = search.toString();

  if (!queryString) {
    return path;
  }

  return `${path}${path.includes('?') ? '&' : '?'}${queryString}`;
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const payload = (await response.json()) as Partial<ApiEnvelope<unknown>>;
    const code = payload.code === undefined ? 'HTTP_ERROR' : String(payload.code);

    return new ApiError(code, response.status, payload.message ?? response.statusText);
  } catch {
    return new ApiError('HTTP_ERROR', response.status, response.statusText);
  }
}

/**
 * Fetches a JSON envelope from the Route Handlers and returns its `data` field.
 * Any non-zero `code` (or non-2xx response) is raised as `ApiError`.
 */
export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const { query, body, headers, ...rest } = init;
  const requestHeaders = new Headers(headers);
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (body !== undefined && !isFormData) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildUrl(path, query), {
    ...rest,
    headers: requestHeaders,
    body: body === undefined || isFormData ? (body as FormData | undefined) : JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  let payload: ApiEnvelope<T>;

  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError('INVALID_RESPONSE', response.status, '响应数据格式不正确');
  }

  if (payload.code !== 0) {
    throw new ApiError(String(payload.code), response.status, payload.message);
  }

  return payload.data;
}
