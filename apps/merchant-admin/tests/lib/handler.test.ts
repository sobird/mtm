import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

vi.mock('@/lib/auth-guard', () => ({
  requireAccount: vi.fn().mockRejectedValue(Object.assign(new Error('未登录'), { code: 'UNAUTHORIZED', status: 401 })),
}));

vi.mock('@/lib/db', () => ({ initDatabase: vi.fn().mockResolvedValue(undefined) }));

const { withAuth, parseQuery, parseBody } = await import('@/lib/handler');

test('returns 401 JSON for unauthenticated handlers', async () => {
  const handler = withAuth(async () => ({ ok: true }));
  const res = await handler(new Request('http://localhost/api/test'), { params: Promise.resolve({}) });
  expect(res.status).toBe(401);
  expect(await res.json()).toMatchObject({ code: 'UNAUTHORIZED', message: '未登录' });
});

describe('parseQuery', () => {
  const schema = z.object({ pn: z.coerce.number().int().optional() });

  test('coerces numeric values', () => {
    expect(parseQuery(new Request('http://localhost/api/test?pn=3'), schema)).toEqual({ pn: 3 });
  });

  test('skips empty values so optionals stay undefined', () => {
    expect(parseQuery(new Request('http://localhost/api/test?pn='), schema)).toEqual({ pn: undefined });
  });

  test('throws INVALID_QUERY for invalid values', () => {
    expect(() => parseQuery(new Request('http://localhost/api/test?pn=abc'), schema)).toThrowError(
      expect.objectContaining({ code: 'INVALID_QUERY', status: 400 })
    );
  });
});

describe('parseBody', () => {
  const schema = z.object({ name: z.string() });

  function jsonRequest(body: string): Request {
    return new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });
  }

  test('parses a valid JSON body', async () => {
    await expect(parseBody(jsonRequest(JSON.stringify({ name: 'x' })), schema)).resolves.toEqual({ name: 'x' });
  });

  test('throws INVALID_BODY for invalid JSON', async () => {
    await expect(parseBody(jsonRequest('{'), schema)).rejects.toMatchObject({ code: 'INVALID_BODY', status: 400 });
  });

  test('throws INVALID_BODY for schema failures', async () => {
    await expect(parseBody(jsonRequest(JSON.stringify({ name: 1 })), schema)).rejects.toMatchObject({
      code: 'INVALID_BODY',
      status: 400,
    });
  });
});
