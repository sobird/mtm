import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import {
  PERMISSIONS,
  apiErrorSchema,
  categoryCreateSchema,
  categoryNodeSchema,
  categoryUpdateSchema,
  idSchema,
} from '@mtm/contracts';

import { requireAnyPermission, requireOpsPermission } from '../auth';
import type { AppEnv } from '../http';
import { sendData } from '../http';
import { createCategory, deleteCategory, listCategoryNodes, updateCategory } from '../services/categories';

const categoryIdParamsSchema = z.object({ id: idSchema });

const nodeEnvelopeSchema = z.object({ data: categoryNodeSchema });
const treeEnvelopeSchema = z.object({ data: z.array(categoryNodeSchema) });
const emptyEnvelopeSchema = z.object({ data: z.null() });

function errorResponse(description: string) {
  return { description, content: { 'application/json': { schema: apiErrorSchema } } };
}

const sharedErrors = {
  400: errorResponse('请求参数不合法'),
  401: errorResponse('未授权'),
  403: errorResponse('无权访问'),
};

const treeRoute = createRoute({
  method: 'get',
  path: '/api/v1/categories/tree',
  tags: ['category'],
  security: [{ bearerAuth: [] }],
  middleware: requireAnyPermission([
    PERMISSIONS.CATEGORY_VIEW,
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
  ]),
  responses: {
    200: {
      description: '类目扁平树（按 level、path、sort 排序）',
      content: { 'application/json': { schema: treeEnvelopeSchema } },
    },
    ...sharedErrors,
  },
});

const createCategoryRoute = createRoute({
  method: 'post',
  path: '/api/v1/categories',
  tags: ['category'],
  security: [{ bearerAuth: [] }],
  middleware: requireOpsPermission(PERMISSIONS.CATEGORY_MANAGE),
  request: {
    body: { required: true, content: { 'application/json': { schema: categoryCreateSchema } } },
  },
  responses: {
    200: {
      description: '创建后的类目节点',
      content: { 'application/json': { schema: nodeEnvelopeSchema } },
    },
    ...sharedErrors,
  },
});

const updateCategoryRoute = createRoute({
  method: 'patch',
  path: '/api/v1/categories/{id}',
  tags: ['category'],
  security: [{ bearerAuth: [] }],
  middleware: requireOpsPermission(PERMISSIONS.CATEGORY_MANAGE),
  request: {
    params: categoryIdParamsSchema,
    body: { required: true, content: { 'application/json': { schema: categoryUpdateSchema } } },
  },
  responses: {
    200: {
      description: '更新后的类目节点',
      content: { 'application/json': { schema: nodeEnvelopeSchema } },
    },
    ...sharedErrors,
    404: errorResponse('类目不存在'),
  },
});

const deleteCategoryRoute = createRoute({
  method: 'delete',
  path: '/api/v1/categories/{id}',
  tags: ['category'],
  security: [{ bearerAuth: [] }],
  middleware: requireOpsPermission(PERMISSIONS.CATEGORY_MANAGE),
  request: { params: categoryIdParamsSchema },
  responses: {
    200: {
      description: '删除成功',
      content: { 'application/json': { schema: emptyEnvelopeSchema } },
    },
    ...sharedErrors,
    404: errorResponse('类目不存在'),
    409: errorResponse('类目存在子类目或已被商品使用'),
  },
});

export function registerCategoryRoutes(app: OpenAPIHono<AppEnv>): void {
  app.openapi(treeRoute, async c => sendData(c, await listCategoryNodes(), 200));

  app.openapi(createCategoryRoute, async c => sendData(c, await createCategory(c.req.valid('json')), 200));

  app.openapi(updateCategoryRoute, async c =>
    sendData(c, await updateCategory(c.req.valid('param').id, c.req.valid('json')), 200)
  );

  app.openapi(deleteCategoryRoute, async c => {
    await deleteCategory(c.req.valid('param').id);
    return sendData(c, null, 200);
  });
}
