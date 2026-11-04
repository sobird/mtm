import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import {
  PERMISSIONS,
  apiErrorSchema,
  auditApproveSchema,
  auditQuerySchema,
  auditRecordSchema,
  auditRejectSchema,
  idSchema,
  pageSchema,
} from '@mtm/contracts';

import { requireOpsPermission } from '../auth';
import type { AppEnv } from '../http';
import { sendData, sendPage } from '../http';
import { approveAudit, getAudit, listAudits, rejectAudit } from '../services/audits';

const auditIdParamsSchema = z.object({ id: idSchema });

const auditEnvelopeSchema = z.object({ data: auditRecordSchema });
const auditPageEnvelopeSchema = pageSchema(auditRecordSchema);

function errorResponse(description: string) {
  return { description, content: { 'application/json': { schema: apiErrorSchema } } };
}

const sharedErrors = {
  400: errorResponse('请求参数不合法'),
  401: errorResponse('未授权'),
  403: errorResponse('无权访问'),
};

const auditMiddleware = requireOpsPermission(PERMISSIONS.PRODUCT_AUDIT);

const listAuditsRoute = createRoute({
  method: 'get',
  path: '/api/v1/audits',
  tags: ['audit'],
  security: [{ bearerAuth: [] }],
  middleware: auditMiddleware,
  request: { query: auditQuerySchema },
  responses: {
    200: {
      description: '审核分页列表（默认按提交时间倒序，按运营范围过滤）',
      content: { 'application/json': { schema: auditPageEnvelopeSchema } },
    },
    ...sharedErrors,
  },
});

const auditDetailRoute = createRoute({
  method: 'get',
  path: '/api/v1/audits/{id}',
  tags: ['audit'],
  security: [{ bearerAuth: [] }],
  middleware: auditMiddleware,
  request: { params: auditIdParamsSchema },
  responses: {
    200: {
      description: '审核详情',
      content: { 'application/json': { schema: auditEnvelopeSchema } },
    },
    ...sharedErrors,
    404: errorResponse('审核记录不存在'),
  },
});

const approveAuditRoute = createRoute({
  method: 'post',
  path: '/api/v1/audits/{id}/approve',
  tags: ['audit'],
  security: [{ bearerAuth: [] }],
  middleware: auditMiddleware,
  request: {
    params: auditIdParamsSchema,
    body: { required: true, content: { 'application/json': { schema: auditApproveSchema } } },
  },
  responses: {
    200: {
      description: '审核通过后的审核记录',
      content: { 'application/json': { schema: auditEnvelopeSchema } },
    },
    ...sharedErrors,
    404: errorResponse('审核记录不存在'),
    409: errorResponse('审核已处理或商品版本状态冲突'),
  },
});

const rejectAuditRoute = createRoute({
  method: 'post',
  path: '/api/v1/audits/{id}/reject',
  tags: ['audit'],
  security: [{ bearerAuth: [] }],
  middleware: auditMiddleware,
  request: {
    params: auditIdParamsSchema,
    body: { required: true, content: { 'application/json': { schema: auditRejectSchema } } },
  },
  responses: {
    200: {
      description: '驳回后的审核记录',
      content: { 'application/json': { schema: auditEnvelopeSchema } },
    },
    ...sharedErrors,
    404: errorResponse('审核记录不存在'),
    409: errorResponse('审核已处理或商品版本状态冲突'),
  },
});

export function registerAuditRoutes(app: OpenAPIHono<AppEnv>): void {
  app.openapi(listAuditsRoute, async c => {
    const { items, meta } = await listAudits(c.get('auth'), c.req.valid('query'));
    return sendPage(c, items, meta);
  });

  app.openapi(auditDetailRoute, async c => sendData(c, await getAudit(c.get('auth'), c.req.valid('param').id), 200));

  app.openapi(approveAuditRoute, async c =>
    sendData(c, await approveAudit(c.get('auth'), c.req.valid('param').id, c.req.valid('json').comment), 200)
  );

  app.openapi(rejectAuditRoute, async c =>
    sendData(c, await rejectAudit(c.get('auth'), c.req.valid('param').id, c.req.valid('json').comment), 200)
  );
}
