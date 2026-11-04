import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import {
  PERMISSIONS,
  apiErrorSchema,
  brandCreateSchema,
  brandQuerySchema,
  brandSchema,
  brandUpdateSchema,
  idSchema,
  pageSchema,
} from '@mtm/contracts';

import { requireAnyPermission, requireOpsPermission } from '../auth';
import type { AppEnv } from '../http';
import { sendData, sendPage } from '../http';
import { createBrand, listBrands, updateBrand } from '../services/brands';

const brandIdParamsSchema = z.object({ id: idSchema });

const brandEnvelopeSchema = z.object({ data: brandSchema });
const brandPageEnvelopeSchema = pageSchema(brandSchema);

function errorResponse(description: string) {
  return { description, content: { 'application/json': { schema: apiErrorSchema } } };
}

const sharedErrors = {
  400: errorResponse('请求参数不合法'),
  401: errorResponse('未授权'),
  403: errorResponse('无权访问'),
};

const listBrandsRoute = createRoute({
  method: 'get',
  path: '/api/v1/brands',
  tags: ['brand'],
  security: [{ bearerAuth: [] }],
  middleware: requireAnyPermission([
    PERMISSIONS.BRAND_MANAGE,
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
  ]),
  request: { query: brandQuerySchema },
  responses: {
    200: {
      description: '品牌分页列表（按名称升序）',
      content: { 'application/json': { schema: brandPageEnvelopeSchema } },
    },
    ...sharedErrors,
  },
});

const createBrandRoute = createRoute({
  method: 'post',
  path: '/api/v1/brands',
  tags: ['brand'],
  security: [{ bearerAuth: [] }],
  middleware: requireOpsPermission(PERMISSIONS.BRAND_MANAGE),
  request: {
    body: { required: true, content: { 'application/json': { schema: brandCreateSchema } } },
  },
  responses: {
    200: {
      description: '创建后的品牌',
      content: { 'application/json': { schema: brandEnvelopeSchema } },
    },
    ...sharedErrors,
    409: errorResponse('品牌名称已存在'),
  },
});

const updateBrandRoute = createRoute({
  method: 'patch',
  path: '/api/v1/brands/{id}',
  tags: ['brand'],
  security: [{ bearerAuth: [] }],
  middleware: requireOpsPermission(PERMISSIONS.BRAND_MANAGE),
  request: {
    params: brandIdParamsSchema,
    body: { required: true, content: { 'application/json': { schema: brandUpdateSchema } } },
  },
  responses: {
    200: {
      description: '更新后的品牌',
      content: { 'application/json': { schema: brandEnvelopeSchema } },
    },
    ...sharedErrors,
    404: errorResponse('品牌不存在'),
    409: errorResponse('品牌名称已存在'),
  },
});

export function registerBrandRoutes(app: OpenAPIHono<AppEnv>): void {
  app.openapi(listBrandsRoute, async c => {
    const { items, meta } = await listBrands(c.req.valid('query'));
    return sendPage(c, items, meta);
  });

  app.openapi(createBrandRoute, async c => sendData(c, await createBrand(c.req.valid('json')), 200));

  app.openapi(updateBrandRoute, async c =>
    sendData(c, await updateBrand(c.req.valid('param').id, c.req.valid('json')), 200)
  );
}
