import type { OpenAPIHono } from '@hono/zod-openapi';
import type { ServiceTokenClaims } from '@mtm/auth/service-token';
import { PERMISSIONS } from '@mtm/contracts';
import { createMiddleware } from 'hono/factory';

import type { AppEnv } from '../http';
import { HttpError, errorBody } from '../http';
import { LocalStorageAdapter, saveUpload } from '../services/uploads';
import type { UploadConfig } from '../services/uploads';

const OPS_UPLOAD_PERMISSIONS = [PERMISSIONS.BRAND_MANAGE, PERMISSIONS.CATEGORY_MANAGE] as const;
const MERCHANT_UPLOAD_PERMISSIONS = [PERMISSIONS.PRODUCT_UPDATE, PERMISSIONS.SHOP_UPDATE] as const;

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

  app.post('/api/v1/uploads/images', requireUploadPermission, async c => {
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
