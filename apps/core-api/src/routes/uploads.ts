import { z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { ServiceTokenClaims } from '@mtm/auth/service-token';
import { PERMISSIONS, uploadResultSchema } from '@mtm/contracts';
import { createMiddleware } from 'hono/factory';

import type { AppEnv } from '../http';
import { HttpError, errorBody } from '../http';
import { assertDeclaredUploadSize, LocalStorageAdapter, saveUpload } from '../services/uploads';
import type { UploadConfig } from '../services/uploads';

const uploadEnvelopeSchema = z.object({ data: uploadResultSchema });

const OPS_UPLOAD_PERMISSIONS = [PERMISSIONS.BRAND_MANAGE, PERMISSIONS.CATEGORY_MANAGE] as const;
const MERCHANT_UPLOAD_PERMISSIONS = [
  PERMISSIONS.PRODUCT_CREATE,
  PERMISSIONS.PRODUCT_UPDATE,
  PERMISSIONS.SHOP_UPDATE,
] as const;

/** Uploads are portal-aware: each portal has its own set of accepted codes. */
function permissionsFor(auth: ServiceTokenClaims): readonly string[] {
  if (auth.portal === 'ops') {
    return OPS_UPLOAD_PERMISSIONS;
  }

  if (auth.portal === 'merchant') {
    return MERCHANT_UPLOAD_PERMISSIONS;
  }

  return [];
}

const requireUploadPermission = createMiddleware<AppEnv>(async (c, next) => {
  const auth = c.get('auth');

  if (!permissionsFor(auth).some(code => auth.permissions.includes(code))) {
    return c.json(errorBody('FORBIDDEN', '无权访问'), 403);
  }

  await next();
});

export function registerUploadRoutes(app: OpenAPIHono<AppEnv>, config: UploadConfig): void {
  const storage = new LocalStorageAdapter(config.dir);

  // Documentation-only registration: the runtime handler stays a plain
  // `app.post` so multipart bodies are not re-parsed by validation.
  app.openAPIRegistry.registerPath({
    method: 'post',
    path: '/api/v1/uploads/images',
    tags: ['upload'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: z.object({ file: z.any().openapi({ type: 'string', format: 'binary' }) }),
          },
        },
      },
    },
    responses: {
      200: {
        description: '上传成功',
        content: { 'application/json': { schema: uploadEnvelopeSchema } },
      },
    },
  });

  app.post('/api/v1/uploads/images', requireUploadPermission, async c => {
    assertDeclaredUploadSize(c.req.header('content-length'), config.maxBytes);

    let form: FormData;

    try {
      form = await c.req.formData();
    } catch {
      throw new HttpError('UPLOAD_INVALID_FILE', 400, '上传文件不合法');
    }

    const auth = c.get('auth');

    const asset = await saveUpload({
      file: form.get('file'),
      uploadedBy: auth.userId,
      merchantId: auth.portal === 'merchant' ? auth.merchantId : null,
      config,
      storage,
    });

    return c.json({ data: asset }, 200);
  });
}
