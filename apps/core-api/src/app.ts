import { serveStatic } from '@hono/node-server/serve-static';
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { Hook } from '@hono/zod-openapi';

import { requireServiceToken } from './auth';
import { prisma } from './db';
import { HttpError, errorBody } from './http';
import type { AppEnv } from './http';
import { registerAuditRoutes } from './routes/audits';
import { registerBrandRoutes } from './routes/brands';
import { registerCategoryRoutes } from './routes/categories';
import { registerMerchantRoutes } from './routes/merchants';
import { registerProductRoutes } from './routes/products';
import { registerUploadRoutes } from './routes/uploads';
import { resolveUploadConfig } from './services/uploads';

const defaultHook: Hook<unknown, AppEnv, string, Response | undefined> = (result, c) => {
  if (!result.success) {
    return c.json(errorBody('INVALID_REQUEST', '请求参数不合法', result.error.issues), 400);
  }
};

const authClaimsSchema = z.object({
  portal: z.enum(['ops', 'merchant']),
  userId: z.string(),
  merchantId: z.string().nullable(),
  permissions: z.array(z.string()),
  merchantScope: z.array(z.string()).nullable(),
});

const meRoute = createRoute({
  method: 'get',
  path: '/api/v1/me',
  tags: ['service'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: '当前服务令牌声明',
      content: { 'application/json': { schema: z.object({ data: authClaimsSchema }) } },
    },
  },
});

export function createApp(): OpenAPIHono<AppEnv> {
  const app = new OpenAPIHono<AppEnv>({ defaultHook });
  const uploadConfig = resolveUploadConfig();

  app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
  });

  app.doc('/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'mtm core-api', version: '0.1.0' },
  });

  app.get('/health', async c => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return c.json({ status: 'ok', db: true });
    } catch {
      return c.json({ status: 'error', db: false }, 503);
    }
  });

  // Public static serving for uploaded images, outside the /api/v1 auth scope.
  app.use(
    '/uploads/*',
    serveStatic({
      root: uploadConfig.dir,
      rewriteRequestPath: path => path.replace(/^\/uploads/, ''),
    })
  );

  // Registered before any /api/v1 route so every route mounted later still
  // runs through service-token verification.
  app.use('/api/v1/*', requireServiceToken);

  app.openapi(meRoute, c => c.json({ data: c.get('auth') }, 200));

  registerCategoryRoutes(app);
  registerBrandRoutes(app);
  registerMerchantRoutes(app);
  registerProductRoutes(app);
  registerAuditRoutes(app);
  registerUploadRoutes(app, uploadConfig);

  app.onError((error, c) => {
    if (error instanceof HttpError) {
      return c.json(errorBody(error.code, error.message, error.details), error.status);
    }

    console.error(error);
    return c.json(errorBody('INTERNAL_ERROR', '服务器内部错误'), 500);
  });

  return app;
}
