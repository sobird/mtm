import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const { getCsrfTokenMock, fetchMock } = vi.hoisted(() => ({
  getCsrfTokenMock: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock('next-auth/react', () => ({ getCsrfToken: getCsrfTokenMock }));

import { signInWithCredentials } from '@/lib/auth-client';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  getCsrfTokenMock.mockResolvedValue('csrf-token');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test('treats a relative success URL as success and posts the credentials', async () => {
  fetchMock.mockResolvedValue(jsonResponse(200, { url: '/login' }));

  await expect(
    signInWithCredentials('password', { identifier: 'merchant@example.com', password: 'merchant123' }, '/')
  ).resolves.toEqual({ error: undefined, code: undefined });

  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
  expect(url).toBe('/api/auth/callback/password');
  expect(init.method).toBe('POST');
  expect(init.headers['X-Auth-Return-Redirect']).toBe('1');
  expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');

  const body = new URLSearchParams(init.body as string);
  expect(body.get('identifier')).toBe('merchant@example.com');
  expect(body.get('password')).toBe('merchant123');
  expect(body.get('csrfToken')).toBe('csrf-token');
  expect(body.get('callbackUrl')).toBe('/');
});

test('returns the error and code from an absolute failure URL', async () => {
  fetchMock.mockResolvedValue(
    jsonResponse(200, { url: 'http://localhost:3000/login?error=CredentialsSignin&code=credentials' })
  );

  await expect(
    signInWithCredentials('password', { identifier: 'merchant@example.com', password: 'wrong' })
  ).resolves.toEqual({ error: 'CredentialsSignin', code: 'credentials' });
});

test('fails without posting when the CSRF token is unavailable', async () => {
  getCsrfTokenMock.mockResolvedValue(undefined);

  await expect(
    signInWithCredentials('password', { identifier: 'merchant@example.com', password: 'merchant123' })
  ).resolves.toEqual({ error: 'Configuration' });
  expect(fetchMock).not.toHaveBeenCalled();
});

test('treats a non-ok response as a failure', async () => {
  fetchMock.mockResolvedValue(jsonResponse(500, null));

  await expect(
    signInWithCredentials('password', { identifier: 'merchant@example.com', password: 'merchant123' })
  ).resolves.toEqual({ error: 'CallbackRouteError' });
});
