import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import {
  PERMISSIONS,
  apiErrorSchema,
  idSchema,
  merchantDetailSchema,
  merchantQuerySchema,
  merchantSchema,
  merchantUpdateSchema,
  pageSchema,
  shopQuerySchema,
  shopSchema,
  shopUpdateSchema,
} from '@mtm/contracts';

import { requireMerchantPermission, requireOpsPermission } from '../auth';
import type { AppEnv } from '../http';
import { HttpError, sendData, sendPage } from '../http';
import {
  getMerchantDetail,
  getMyMerchant,
  getShop,
  listMerchants,
  listShops,
  updateMyMerchant,
  updateShop,
} from '../services/merchants';

const merchantIdParamsSchema = z.object({ id: idSchema });
const shopIdParamsSchema = z.object({ id: idSchema });

const merchantEnvelopeSchema = z.object({ data: merchantSchema });
const merchantDetailEnvelopeSchema = z.object({ data: merchantDetailSchema });
const shopEnvelopeSchema = z.object({ data: shopSchema });
const merchantPageEnvelopeSchema = pageSchema(merchantSchema);
const shopPageEnvelopeSchema = pageSchema(shopSchema);

function errorResponse(description: string) {
  return { description, content: { 'application/json': { schema: apiErrorSchema } } };
}

const sharedErrors = {
  400: errorResponse('请求参数不合法'),
  401: errorResponse('未授权'),
  403: errorResponse('无权访问'),
};

function requireMerchantSession(auth: AppEnv['Variables']['auth']): string {
  if (auth.portal !== 'merchant' || !auth.merchantId) {
    throw new HttpError('FORBIDDEN', 403, '无权访问');
  }

  return auth.merchantId;
}

const listMerchantsRoute = createRoute({
  method: 'get',
  path: '/api/v1/merchants',
  tags: ['merchant'],
  security: [{ bearerAuth: [] }],
  middleware: requireOpsPermission(PERMISSIONS.MERCHANT_VIEW),
  request: { query: merchantQuerySchema },
  responses: {
    200: {
      description: '商家分页列表（按编码升序，按运营范围过滤）',
      content: { 'application/json': { schema: merchantPageEnvelopeSchema } },
    },
    ...sharedErrors,
  },
});

const myMerchantRoute = createRoute({
  method: 'get',
  path: '/api/v1/merchants/me',
  tags: ['merchant'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: '当前商家及其店铺',
      content: { 'application/json': { schema: merchantDetailEnvelopeSchema } },
    },
    ...sharedErrors,
    404: errorResponse('商家不存在'),
  },
});

const updateMyMerchantRoute = createRoute({
  method: 'patch',
  path: '/api/v1/merchants/me',
  tags: ['merchant'],
  security: [{ bearerAuth: [] }],
  middleware: requireMerchantPermission(PERMISSIONS.MERCHANT_UPDATE),
  request: {
    body: { required: true, content: { 'application/json': { schema: merchantUpdateSchema } } },
  },
  responses: {
    200: {
      description: '更新后的商家',
      content: { 'application/json': { schema: merchantEnvelopeSchema } },
    },
    ...sharedErrors,
    404: errorResponse('商家不存在'),
  },
});

const merchantDetailRoute = createRoute({
  method: 'get',
  path: '/api/v1/merchants/{id}',
  tags: ['merchant'],
  security: [{ bearerAuth: [] }],
  middleware: requireOpsPermission(PERMISSIONS.MERCHANT_VIEW),
  request: { params: merchantIdParamsSchema },
  responses: {
    200: {
      description: '商家详情（含店铺）',
      content: { 'application/json': { schema: merchantDetailEnvelopeSchema } },
    },
    ...sharedErrors,
    404: errorResponse('商家不存在'),
  },
});

const listShopsRoute = createRoute({
  method: 'get',
  path: '/api/v1/shops',
  tags: ['shop'],
  security: [{ bearerAuth: [] }],
  middleware: requireOpsPermission(PERMISSIONS.SHOP_VIEW),
  request: { query: shopQuerySchema },
  responses: {
    200: {
      description: '店铺分页列表（按名称升序，按商家范围过滤）',
      content: { 'application/json': { schema: shopPageEnvelopeSchema } },
    },
    ...sharedErrors,
  },
});

const shopDetailRoute = createRoute({
  method: 'get',
  path: '/api/v1/shops/{id}',
  tags: ['shop'],
  security: [{ bearerAuth: [] }],
  middleware: requireOpsPermission(PERMISSIONS.SHOP_VIEW),
  request: { params: shopIdParamsSchema },
  responses: {
    200: {
      description: '店铺详情',
      content: { 'application/json': { schema: shopEnvelopeSchema } },
    },
    ...sharedErrors,
    404: errorResponse('店铺不存在'),
  },
});

const updateShopRoute = createRoute({
  method: 'patch',
  path: '/api/v1/shops/{id}',
  tags: ['shop'],
  security: [{ bearerAuth: [] }],
  middleware: requireMerchantPermission(PERMISSIONS.SHOP_UPDATE),
  request: {
    params: shopIdParamsSchema,
    body: { required: true, content: { 'application/json': { schema: shopUpdateSchema } } },
  },
  responses: {
    200: {
      description: '更新后的店铺',
      content: { 'application/json': { schema: shopEnvelopeSchema } },
    },
    ...sharedErrors,
    404: errorResponse('店铺不存在'),
  },
});

export function registerMerchantRoutes(app: OpenAPIHono<AppEnv>): void {
  app.openapi(listMerchantsRoute, async c => {
    const { items, meta } = await listMerchants(c.get('auth'), c.req.valid('query'));
    return sendPage(c, items, meta);
  });

  // `/merchants/me` must be registered before `/merchants/{id}` so the literal
  // path wins over the parameterized one.
  app.openapi(myMerchantRoute, async c => sendData(c, await getMyMerchant(requireMerchantSession(c.get('auth'))), 200));

  app.openapi(updateMyMerchantRoute, async c =>
    sendData(c, await updateMyMerchant(requireMerchantSession(c.get('auth')), c.req.valid('json')), 200)
  );

  app.openapi(merchantDetailRoute, async c =>
    sendData(c, await getMerchantDetail(c.get('auth'), c.req.valid('param').id), 200)
  );

  app.openapi(listShopsRoute, async c => {
    const { items, meta } = await listShops(c.get('auth'), c.req.valid('query'));
    return sendPage(c, items, meta);
  });

  app.openapi(shopDetailRoute, async c => sendData(c, await getShop(c.get('auth'), c.req.valid('param').id), 200));

  app.openapi(updateShopRoute, async c => {
    const merchantId = requireMerchantSession(c.get('auth'));
    return sendData(c, await updateShop(c.req.valid('param').id, merchantId, c.req.valid('json')), 200);
  });
}
