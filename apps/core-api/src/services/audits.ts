import type { ServiceTokenClaims } from '@mtm/auth/service-token';
import { PERMISSIONS, type AuditQuery, type AuditRecordDTO, type PageMeta } from '@mtm/contracts';

import { prisma } from '../db';
import { Prisma } from '../generated/prisma';
import { HttpError, assertMerchantVisible, normalizePage } from '../http';

type AuditRow = Prisma.AuditRecordGetPayload<{
  include: { productVersion: { include: { product: true } } };
}>;

type AuditNames = {
  merchants: Map<string, string>;
  shops: Map<string, string>;
  categories: Map<string, string>;
};

type Decision = 'APPROVED' | 'REJECTED';

function auditNotFound(): HttpError {
  return new HttpError('AUDIT_NOT_FOUND', 404, '审核记录不存在');
}

function hasFullScope(auth: ServiceTokenClaims): boolean {
  return auth.permissions.includes(PERMISSIONS.PLATFORM_CROSS_TENANT) || auth.merchantScope === null;
}

async function loadAuditNames(rows: AuditRow[]): Promise<AuditNames> {
  const merchantIds = [...new Set(rows.map(row => row.productVersion.product.merchantId))];
  const shopIds = [...new Set(rows.map(row => row.productVersion.product.shopId))];
  const categoryIds = [...new Set(rows.map(row => row.productVersion.product.categoryId))];

  const [merchants, shops, categories] = await Promise.all([
    prisma.merchant.findMany({ where: { id: { in: merchantIds } }, select: { id: true, name: true } }),
    prisma.shop.findMany({ where: { id: { in: shopIds } }, select: { id: true, name: true } }),
    prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } }),
  ]);

  return {
    merchants: new Map(merchants.map(merchant => [merchant.id, merchant.name])),
    shops: new Map(shops.map(shop => [shop.id, shop.name])),
    categories: new Map(categories.map(category => [category.id, category.name])),
  };
}

function toAuditRecord(row: AuditRow, names: AuditNames): AuditRecordDTO {
  const version = row.productVersion;
  const product = version.product;

  return {
    id: row.id,
    productVersionId: row.productVersionId,
    status: row.status,
    submitterId: row.submitterId,
    reviewerId: row.reviewerId,
    comment: row.comment,
    submittedAt: row.submittedAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    product: {
      id: product.id,
      code: product.code,
      title: version.title,
      mainImageUrl: version.mainImageUrl,
      version: version.version,
      merchantId: product.merchantId,
      merchantName: names.merchants.get(product.merchantId) ?? '',
      shopName: names.shops.get(product.shopId) ?? '',
      categoryName: names.categories.get(product.categoryId) ?? '',
    },
  };
}

/**
 * Builds the audit list filter. Merchant scope is applied through the owning
 * product relation, and soft-deleted products stay hidden from operations.
 */
function auditWhere(auth: ServiceTokenClaims, query: AuditQuery): Prisma.AuditRecordWhereInput {
  const versionFilter: Prisma.ProductVersionWhereInput = { product: { deletedAt: null } };

  if (!hasFullScope(auth)) {
    versionFilter.product = { deletedAt: null, merchantId: { in: auth.merchantScope ?? [] } };
  }

  if (query.keyword) {
    versionFilter.OR = [
      { title: { contains: query.keyword, mode: 'insensitive' } },
      { product: { is: { code: { contains: query.keyword, mode: 'insensitive' } } } },
    ];
  }

  const where: Prisma.AuditRecordWhereInput = { productVersion: versionFilter };

  if (query.status) {
    where.status = query.status;
  }

  return where;
}

export async function listAudits(
  auth: ServiceTokenClaims,
  query: AuditQuery
): Promise<{ items: AuditRecordDTO[]; meta: PageMeta }> {
  const { page, pageSize, skip, take } = normalizePage(query);
  const where = auditWhere(auth, query);

  const [total, rows] = await prisma.$transaction([
    prisma.auditRecord.count({ where }),
    prisma.auditRecord.findMany({
      where,
      include: { productVersion: { include: { product: true } } },
      orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }],
      skip,
      take,
    }),
  ]);

  const names = await loadAuditNames(rows);

  return { items: rows.map(row => toAuditRecord(row, names)), meta: { page, pageSize, total } };
}

export async function getAudit(auth: ServiceTokenClaims, id: string): Promise<AuditRecordDTO> {
  const row = await prisma.auditRecord.findUnique({
    where: { id },
    include: { productVersion: { include: { product: true } } },
  });

  if (!row || row.productVersion.product.deletedAt) {
    throw auditNotFound();
  }

  assertMerchantVisible(auth, row.productVersion.product.merchantId);

  const names = await loadAuditNames([row]);

  return toAuditRecord(row, names);
}

/**
 * Applies a review decision atomically: the audit record must still be
 * PENDING and its version must still be SUBMITTED, otherwise the whole
 * transaction rolls back and reports a conflict.
 */
async function decide(
  auth: ServiceTokenClaims,
  id: string,
  next: Decision,
  comment: string | undefined
): Promise<AuditRecordDTO> {
  const existing = await prisma.auditRecord.findUnique({
    where: { id },
    include: { productVersion: { include: { product: true } } },
  });

  if (!existing || existing.productVersion.product.deletedAt) {
    throw auditNotFound();
  }

  assertMerchantVisible(auth, existing.productVersion.product.merchantId);

  const now = new Date();

  await prisma.$transaction(async tx => {
    const auditUpdated = await tx.auditRecord.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: next, reviewerId: auth.userId, reviewedAt: now, comment: comment ?? null },
    });

    if (auditUpdated.count === 0) {
      throw new HttpError('AUDIT_ALREADY_REVIEWED', 409, '该审核已处理');
    }

    const versionUpdated = await tx.productVersion.updateMany({
      where: { id: existing.productVersionId, status: 'SUBMITTED' },
      data: { status: next, reviewedAt: now },
    });

    if (versionUpdated.count === 0) {
      throw new HttpError('AUDIT_VERSION_CONFLICT', 409, '商品版本状态已变化，无法审核');
    }
  });

  return getAudit(auth, id);
}

export function approveAudit(auth: ServiceTokenClaims, id: string, comment?: string): Promise<AuditRecordDTO> {
  return decide(auth, id, 'APPROVED', comment);
}

export function rejectAudit(auth: ServiceTokenClaims, id: string, comment: string): Promise<AuditRecordDTO> {
  return decide(auth, id, 'REJECTED', comment);
}
