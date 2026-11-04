import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import {
  PERMISSIONS,
  apiErrorSchema,
  idSchema,
  pageSchema,
  productCreateSchema,
  productDetailSchema,
  productListRowSchema,
  productQuerySchema,
  productUpdateSchema,
} from '@mtm/contracts';

import { requireAnyPermission, requireMerchantPermission } from '../auth';
import type { AppEnv } from '../http';
import { sendData, sendPage } from '../http';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  offlineProduct,
  publishProduct,
  submitProduct,
  updateProduct,
} from '../services/products';

const productIdParamsSchema = z.object({ id: idSchema });

const productDetailEnvelopeSchema = z.object({ data: productDetailSchema });
const productPageEnvelopeSchema = pageSchema(productListRowSchema);

function errorResponse(description: string) {
  return { description, content: { 'application/json': { schema: apiErrorSchema } } };
}

const sharedErrors = {
  400: errorResponse('请求参数不合法'),
  401: errorResponse('未授权'),
  403: errorResponse('无权访问'),
};

const listProductsRoute = createRoute({
  method: 'get',
  path: '/api/v1/products',
  tags: ['product'],
  security: [{ bearerAuth: [] }],
  middleware: requireAnyPermission([PERMISSIONS.PRODUCT_VIEW, PERMISSIONS.PRODUCT_AUDIT]),
  request: { query: productQuerySchema },
  responses: {
    200: {
      description: '商品分页列表',
      content: { 'application/json': { schema: productPageEnvelopeSchema } },
    },
    ...sharedErrors,
  },
});

const createProductRoute = createRoute({
  method: 'post',
  path: '/api/v1/products',
  tags: ['product'],
  security: [{ bearerAuth: [] }],
  middleware: requireMerchantPermission(PERMISSIONS.PRODUCT_CREATE),
  request: { body: { required: true, content: { 'application/json': { schema: productCreateSchema } } } },
  responses: {
    200: {
      description: '创建后的商品详情',
      content: { 'application/json': { schema: productDetailEnvelopeSchema } },
    },
    ...sharedErrors,
    409: errorResponse('商品编码已存在'),
  },
});

const productDetailRoute = createRoute({
  method: 'get',
  path: '/api/v1/products/{id}',
  tags: ['product'],
  security: [{ bearerAuth: [] }],
  middleware: requireAnyPermission([PERMISSIONS.PRODUCT_VIEW, PERMISSIONS.PRODUCT_AUDIT]),
  request: { params: productIdParamsSchema },
  responses: {
    200: {
      description: '商品详情',
      content: { 'application/json': { schema: productDetailEnvelopeSchema } },
    },
    ...sharedErrors,
    404: errorResponse('商品不存在'),
  },
});

const updateProductRoute = createRoute({
  method: 'patch',
  path: '/api/v1/products/{id}',
  tags: ['product'],
  security: [{ bearerAuth: [] }],
  middleware: requireMerchantPermission(PERMISSIONS.PRODUCT_UPDATE),
  request: {
    params: productIdParamsSchema,
    body: { required: true, content: { 'application/json': { schema: productUpdateSchema } } },
  },
  responses: {
    200: {
      description: '更新后的商品详情',
      content: { 'application/json': { schema: productDetailEnvelopeSchema } },
    },
    ...sharedErrors,
    404: errorResponse('商品不存在'),
    409: errorResponse('商品审核中或版本冲突'),
  },
});

const submitProductRoute = createRoute({
  method: 'post',
  path: '/api/v1/products/{id}/submit',
  tags: ['product'],
  security: [{ bearerAuth: [] }],
  middleware: requireMerchantPermission(PERMISSIONS.PRODUCT_SUBMIT),
  request: { params: productIdParamsSchema },
  responses: {
    200: {
      description: '提交审核后的商品详情',
      content: { 'application/json': { schema: productDetailEnvelopeSchema } },
    },
    ...sharedErrors,
    404: errorResponse('商品不存在'),
    409: errorResponse('商品不是草稿状态'),
  },
});

const publishProductRoute = createRoute({
  method: 'post',
  path: '/api/v1/products/{id}/publish',
  tags: ['product'],
  security: [{ bearerAuth: [] }],
  middleware: requireMerchantPermission(PERMISSIONS.PRODUCT_PUBLISH),
  request: { params: productIdParamsSchema },
  responses: {
    200: {
      description: '发布后的商品详情',
      content: { 'application/json': { schema: productDetailEnvelopeSchema } },
    },
    ...sharedErrors,
    404: errorResponse('商品不存在'),
    409: errorResponse('商品未通过审核'),
  },
});

const offlineProductRoute = createRoute({
  method: 'post',
  path: '/api/v1/products/{id}/offline',
  tags: ['product'],
  security: [{ bearerAuth: [] }],
  middleware: requireMerchantPermission(PERMISSIONS.PRODUCT_PUBLISH),
  request: { params: productIdParamsSchema },
  responses: {
    200: {
      description: '下线后的商品详情',
      content: { 'application/json': { schema: productDetailEnvelopeSchema } },
    },
    ...sharedErrors,
    404: errorResponse('商品不存在'),
    409: errorResponse('商品未发布'),
  },
});

const deleteProductRoute = createRoute({
  method: 'delete',
  path: '/api/v1/products/{id}',
  tags: ['product'],
  security: [{ bearerAuth: [] }],
  middleware: requireMerchantPermission(PERMISSIONS.PRODUCT_DELETE),
  request: { params: productIdParamsSchema },
  responses: {
    200: {
      description: '商品已删除',
      content: { 'application/json': { schema: z.object({ data: z.null() }) } },
    },
    ...sharedErrors,
    404: errorResponse('商品不存在'),
    409: errorResponse('商品审核中或已发布'),
  },
});

export function registerProductRoutes(app: OpenAPIHono<AppEnv>): void {
  app.openapi(listProductsRoute, async c => {
    const { items, meta } = await listProducts(c.get('auth'), c.req.valid('query'));
    return sendPage(c, items, meta);
  });

  app.openapi(createProductRoute, async c => sendData(c, await createProduct(c.get('auth'), c.req.valid('json')), 200));

  app.openapi(productDetailRoute, async c =>
    sendData(c, await getProduct(c.get('auth'), c.req.valid('param').id), 200)
  );

  app.openapi(updateProductRoute, async c =>
    sendData(c, await updateProduct(c.get('auth'), c.req.valid('param').id, c.req.valid('json')), 200)
  );

  app.openapi(submitProductRoute, async c =>
    sendData(c, await submitProduct(c.get('auth'), c.req.valid('param').id), 200)
  );

  app.openapi(publishProductRoute, async c =>
    sendData(c, await publishProduct(c.get('auth'), c.req.valid('param').id), 200)
  );

  app.openapi(offlineProductRoute, async c =>
    sendData(c, await offlineProduct(c.get('auth'), c.req.valid('param').id), 200)
  );

  app.openapi(deleteProductRoute, async c => {
    await deleteProduct(c.get('auth'), c.req.valid('param').id);
    return sendData(c, null, 200);
  });
}
