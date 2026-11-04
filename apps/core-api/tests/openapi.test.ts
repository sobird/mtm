import { expect, test } from 'vitest';

import { createApp } from '@/src/app';

test('OpenAPI 文档包含上传图片接口', async () => {
  const res = await createApp().request('/openapi.json');
  expect(res.status).toBe(200);

  const doc = (await res.json()) as {
    paths: Record<string, Record<string, unknown>>;
    components: { securitySchemes: Record<string, unknown> };
  };

  expect(doc.paths['/api/v1/me']).toBeTruthy();
  expect(doc.paths['/api/v1/products']).toBeTruthy();
  expect(doc.paths['/api/v1/products/{id}']).toBeTruthy();
  expect(doc.paths['/api/v1/audits']?.get).toMatchObject({ tags: ['audit'], security: [{ bearerAuth: [] }] });
  expect(doc.paths['/api/v1/audits/{id}']?.get).toBeTruthy();
  expect(doc.paths['/api/v1/audits/{id}/approve']?.post).toBeTruthy();
  expect(doc.paths['/api/v1/audits/{id}/reject']?.post).toBeTruthy();
  expect(doc.paths['/api/v1/uploads/images']?.post).toMatchObject({
    tags: ['upload'],
    security: [{ bearerAuth: [] }],
  });
  expect(doc.components.securitySchemes.bearerAuth).toMatchObject({ type: 'http', scheme: 'bearer' });
});
