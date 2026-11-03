import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DEMO_MERCHANT_ID } from '@mtm/contracts';
import { afterAll, beforeEach, expect, test } from 'vitest';

import { createApp } from '@/src/app';
import { prisma } from '@/src/db';

import { merchantToken, opsToken, resetCoreFixtures } from './helpers';

const uploadDir = mkdtempSync(join(tmpdir(), 'mtm-upload-'));
const previousUploadEnv = {
  UPLOAD_DIR: process.env.UPLOAD_DIR,
  UPLOAD_MAX_BYTES: process.env.UPLOAD_MAX_BYTES,
  CORE_PUBLIC_URL: process.env.CORE_PUBLIC_URL,
};

// The app reads upload config on every `createApp()`, so setting these before
// the first request is enough to point storage at a fresh temp directory.
process.env.UPLOAD_DIR = uploadDir;
process.env.UPLOAD_MAX_BYTES = '1024';
process.env.CORE_PUBLIC_URL = 'http://core.test';

beforeEach(async () => {
  await resetCoreFixtures();
});

afterAll(() => {
  process.env.UPLOAD_DIR = previousUploadEnv.UPLOAD_DIR;
  process.env.UPLOAD_MAX_BYTES = previousUploadEnv.UPLOAD_MAX_BYTES;
  process.env.CORE_PUBLIC_URL = previousUploadEnv.CORE_PUBLIC_URL;
  rmSync(uploadDir, { recursive: true, force: true });
});

function fileForm(name: string, type: string, size: number): FormData {
  const form = new FormData();
  form.append('file', new File([new Uint8Array(size)], name, { type }));

  return form;
}

async function upload(form: FormData, permissions: string[]) {
  return createApp().request('/api/v1/uploads/images', {
    method: 'POST',
    headers: { authorization: `Bearer ${await opsToken(permissions)}` },
    body: form,
  });
}

test('运营端上传 PNG 成功并可通过 /uploads 读取', async () => {
  const app = createApp();
  const form = new FormData();
  form.append('file', new File([new Uint8Array([1, 2, 3])], 'x.png', { type: 'image/png' }));

  const res = await app.request('/api/v1/uploads/images', {
    method: 'POST',
    headers: { authorization: `Bearer ${await opsToken(['brand:manage'])}` },
    body: form,
  });

  expect(res.status).toBe(200);
  const { data } = (await res.json()) as { data: { id: string; url: string } };
  expect(data.url).toMatch(/^http:\/\/core\.test\/uploads\/[0-9a-f-]+\.png$/);
  expect(await prisma.mediaAsset.count({ where: { id: data.id, merchantId: null } })).toBe(1);

  const file = await app.request(new URL(data.url).pathname);
  expect(file.status).toBe(200);
  expect(file.headers.get('content-type')).toContain('image/png');
});

test('商家上传记录自己的 merchantId', async () => {
  const form = new FormData();
  form.append('file', new File([new Uint8Array([1, 2, 3])], 'x.webp', { type: 'image/webp' }));

  const res = await createApp().request('/api/v1/uploads/images', {
    method: 'POST',
    headers: { authorization: `Bearer ${await merchantToken(DEMO_MERCHANT_ID, ['product:update'])}` },
    body: form,
  });

  const { data } = (await res.json()) as { data: { id: string } };
  expect((await prisma.mediaAsset.findUniqueOrThrow({ where: { id: data.id } })).merchantId).toBe(DEMO_MERCHANT_ID);
});

test('缺少文件、非法类型、超限与路径穿越被拒绝', async () => {
  expect((await upload(new FormData(), ['brand:manage'])).status).toBe(400);
  expect((await upload(fileForm('a.txt', 'text/plain', 3), ['brand:manage'])).status).toBe(400);
  expect((await upload(fileForm('big.png', 'image/png', 2048), ['brand:manage'])).status).toBe(400);
  expect((await createApp().request('/uploads/..%2Fsecret.txt')).status).toBe(404);
});

test('没有上传权限的商家返回 403', async () => {
  const form = fileForm('x.png', 'image/png', 3);
  const res = await createApp().request('/api/v1/uploads/images', {
    method: 'POST',
    headers: { authorization: `Bearer ${await merchantToken(DEMO_MERCHANT_ID, ['product:view'])}` },
    body: form,
  });

  expect(res.status).toBe(403);
});
