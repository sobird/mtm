import type { ServiceTokenClaims } from '@mtm/auth/service-token';
import {
  PERMISSIONS,
  type PageMeta,
  type ProductCreateInput,
  type ProductDetailDTO,
  type ProductListRowDTO,
  type ProductQuery,
  type ProductUpdateInput,
  type ProductVersionDTO,
  type ProductVersionInput,
  type ProductVersionStatus,
  type ProductVersionSummaryDTO,
  type SkuDTO,
} from '@mtm/contracts';

import { prisma } from '../db';
import { Prisma } from '../generated/prisma';
import { HttpError, assertMerchantVisible, normalizePage } from '../http';

const OPS_VISIBLE_STATUSES = ['SUBMITTED', 'APPROVED', 'PUBLISHED'] as const;
const OPS_VISIBLE_SET = new Set<string>(OPS_VISIBLE_STATUSES);

type VersionWithSkus = Prisma.ProductVersionGetPayload<{ include: { skus: true } }>;
type VersionSummary = Prisma.ProductVersionGetPayload<Record<string, never>>;
type SkuRow = Prisma.SkuGetPayload<Record<string, never>>;

type ProductDetailRow = Prisma.ProductGetPayload<{
  include: {
    currentVersion: { include: { skus: true } };
    publishedVersion: { include: { skus: true } };
    versions: true;
  };
}>;

type NameMaps = {
  merchants: Map<string, string>;
  shops: Map<string, string>;
  categories: Map<string, string>;
  brands: Map<string, string>;
};

type NameLookupRow = {
  merchantId: string;
  shopId: string;
  categoryId: string;
  brandId: string | null;
};

function productNotFound(): HttpError {
  return new HttpError('PRODUCT_NOT_FOUND', 404, '商品不存在');
}

function asStringArray(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function asStringRecord(value: Prisma.JsonValue): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, typeof item === 'string' ? item : String(item)])
  );
}

function attributeOptions(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(option => String(option));
}

async function loadNameMaps(rows: NameLookupRow[]): Promise<NameMaps> {
  const merchantIds = [...new Set(rows.map(row => row.merchantId))];
  const shopIds = [...new Set(rows.map(row => row.shopId))];
  const categoryIds = [...new Set(rows.map(row => row.categoryId))];
  const brandIds = [...new Set(rows.flatMap(row => (row.brandId ? [row.brandId] : [])))];

  const [merchants, shops, categories, brands] = await Promise.all([
    prisma.merchant.findMany({ where: { id: { in: merchantIds } }, select: { id: true, name: true } }),
    prisma.shop.findMany({ where: { id: { in: shopIds } }, select: { id: true, name: true } }),
    prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } }),
    prisma.brand.findMany({ where: { id: { in: brandIds } }, select: { id: true, name: true } }),
  ]);

  return {
    merchants: new Map(merchants.map(merchant => [merchant.id, merchant.name])),
    shops: new Map(shops.map(shop => [shop.id, shop.name])),
    categories: new Map(categories.map(category => [category.id, category.name])),
    brands: new Map(brands.map(brand => [brand.id, brand.name])),
  };
}

function toSku(sku: SkuRow): SkuDTO {
  return {
    id: sku.id,
    skuCode: sku.skuCode,
    specs: asStringRecord(sku.specs),
    price: sku.price.toFixed(2),
    stock: sku.stock,
    status: sku.status,
  };
}

function toVersion(version: VersionWithSkus): ProductVersionDTO {
  return {
    id: version.id,
    version: version.version,
    status: version.status,
    title: version.title,
    subtitle: version.subtitle,
    mainImageUrl: version.mainImageUrl,
    images: asStringArray(version.images),
    description: version.description,
    attributes: asStringRecord(version.attributes),
    createdBy: version.createdBy,
    createdAt: version.createdAt.toISOString(),
    submittedAt: version.submittedAt?.toISOString() ?? null,
    reviewedAt: version.reviewedAt?.toISOString() ?? null,
    publishedAt: version.publishedAt?.toISOString() ?? null,
    skus: version.skus.map(toSku),
  };
}

function toVersionSummary(version: VersionSummary): ProductVersionSummaryDTO {
  return {
    id: version.id,
    version: version.version,
    status: version.status,
    title: version.title,
    createdAt: version.createdAt.toISOString(),
    submittedAt: version.submittedAt?.toISOString() ?? null,
    reviewedAt: version.reviewedAt?.toISOString() ?? null,
    publishedAt: version.publishedAt?.toISOString() ?? null,
  };
}

type CurrentVersionSnapshot = {
  id: string;
  version: number;
  status: ProductVersionStatus;
  title: string;
  mainImageUrl: string;
};

type ProductRowFields = {
  id: string;
  code: string;
  merchantId: string;
  shopId: string;
  categoryId: string;
  brandId: string | null;
  currentVersionId: string | null;
  publishedVersionId: string | null;
  updatedAt: Date;
};

function toProductRow(product: ProductRowFields, current: CurrentVersionSnapshot, names: NameMaps): ProductListRowDTO {
  return {
    id: product.id,
    code: product.code,
    title: current.title,
    mainImageUrl: current.mainImageUrl,
    categoryId: product.categoryId,
    categoryName: names.categories.get(product.categoryId) ?? '',
    brandId: product.brandId,
    brandName: product.brandId ? (names.brands.get(product.brandId) ?? null) : null,
    shopId: product.shopId,
    shopName: names.shops.get(product.shopId) ?? '',
    merchantId: product.merchantId,
    merchantName: names.merchants.get(product.merchantId) ?? '',
    status: current.status,
    version: current.version,
    currentVersionId: current.id,
    publishedVersionId: product.publishedVersionId,
    updatedAt: product.updatedAt.toISOString(),
  };
}

function toProductDetail(product: ProductDetailRow, names: NameMaps): ProductDetailDTO {
  if (!product.currentVersion) {
    throw productNotFound();
  }

  return {
    ...toProductRow(product, product.currentVersion, names),
    currentVersion: toVersion(product.currentVersion),
    publishedVersion: product.publishedVersion ? toVersion(product.publishedVersion) : null,
    versions: product.versions.map(toVersionSummary),
  };
}

/**
 * Validates the version-level payload shared by create, update and later
 * submit/publish flows. Attributes are keyed by category attribute id.
 */
export async function assertVersionInput(input: ProductVersionInput): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
    include: { attributes: true },
  });

  if (!category) {
    throw new HttpError('PRODUCT_CATEGORY_INVALID', 400, '商品类目不存在');
  }

  if (input.brandId) {
    const brand = await prisma.brand.findUnique({ where: { id: input.brandId } });

    if (!brand || brand.status === 'DISABLED') {
      throw new HttpError('PRODUCT_BRAND_INVALID', 400, '商品品牌不可用');
    }
  }

  const attributes = new Map(category.attributes.map(attribute => [attribute.id, attribute]));
  const provided = input.attributes;

  for (const attributeId of Object.keys(provided)) {
    if (!attributes.has(attributeId)) {
      throw new HttpError('PRODUCT_ATTRIBUTE_UNKNOWN', 400, '商品属性不属于该类目');
    }
  }

  for (const attribute of attributes.values()) {
    const rawValue = provided[attribute.id];
    const value = rawValue?.trim() ?? '';

    if (attribute.required && value === '') {
      throw new HttpError('PRODUCT_ATTRIBUTE_REQUIRED', 400, '缺少必填商品属性');
    }

    // Optional attributes left blank are treated as omitted.
    if (value === '') {
      continue;
    }

    if (attribute.type === 'SELECT' && !attributeOptions(attribute.options).includes(value)) {
      throw new HttpError('PRODUCT_ATTRIBUTE_INVALID', 400, '商品属性值不合法');
    }

    if (attribute.type === 'NUMBER' && !Number.isFinite(Number(value))) {
      throw new HttpError('PRODUCT_ATTRIBUTE_INVALID', 400, '商品属性值不合法');
    }
  }

  const skuCodes = new Set<string>();

  for (const sku of input.skus) {
    const normalized = sku.skuCode.toLowerCase();

    if (skuCodes.has(normalized)) {
      throw new HttpError('PRODUCT_SKU_DUPLICATE', 400, 'SKU 编码重复');
    }

    skuCodes.add(normalized);
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

type ProductForWrite = Prisma.ProductGetPayload<{ include: { currentVersion: true } }>;
type OwnedProductForWrite = Omit<ProductForWrite, 'currentVersion'> & {
  currentVersion: NonNullable<ProductForWrite['currentVersion']>;
};

/**
 * Loads a merchant-owned product for write operations. Cross-tenant or
 * missing/deleted products are reported as 404 so tenants cannot probe ids.
 */
async function getOwnedProductForWrite(auth: ServiceTokenClaims, id: string): Promise<OwnedProductForWrite> {
  if (auth.portal !== 'merchant' || !auth.merchantId) {
    throw new HttpError('FORBIDDEN', 403, '无权访问');
  }

  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: { currentVersion: true },
  });

  if (!product || product.merchantId !== auth.merchantId || !product.currentVersion) {
    throw productNotFound();
  }

  return product as OwnedProductForWrite;
}

export async function createProduct(auth: ServiceTokenClaims, input: ProductCreateInput): Promise<ProductDetailDTO> {
  if (auth.portal !== 'merchant' || !auth.merchantId) {
    throw new HttpError('FORBIDDEN', 403, '无权访问');
  }

  const merchantId = auth.merchantId;
  const shop = await prisma.shop.findFirst({ where: { id: input.shopId, merchantId } });

  if (!shop) {
    throw new HttpError('PRODUCT_SHOP_INVALID', 400, '店铺不属于当前商家');
  }

  await assertVersionInput(input);

  let productId: string;

  try {
    productId = await prisma.$transaction(async tx => {
      const product = await tx.product.create({
        data: {
          merchantId,
          shopId: input.shopId,
          categoryId: input.categoryId,
          brandId: input.brandId,
          code: input.code,
        },
      });

      const version = await tx.productVersion.create({
        data: {
          productId: product.id,
          version: 1,
          status: 'DRAFT',
          title: input.title,
          subtitle: input.subtitle,
          mainImageUrl: input.images[0],
          images: input.images,
          description: input.description,
          attributes: input.attributes,
          createdBy: auth.userId,
          skus: {
            create: input.skus.map(sku => ({
              skuCode: sku.skuCode,
              specs: sku.specs,
              price: sku.price,
              stock: sku.stock,
              status: sku.status,
            })),
          },
        },
      });

      await tx.product.update({ where: { id: product.id }, data: { currentVersionId: version.id } });

      return product.id;
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new HttpError('PRODUCT_CODE_EXISTS', 409, '商品编码已存在');
    }

    throw error;
  }

  return getProduct(auth, productId);
}

export async function updateProduct(
  auth: ServiceTokenClaims,
  id: string,
  input: ProductUpdateInput
): Promise<ProductDetailDTO> {
  const product = await getOwnedProductForWrite(auth, id);

  if (product.currentVersion.status === 'SUBMITTED') {
    throw new HttpError('PRODUCT_IN_REVIEW', 409, '商品审核中，无法编辑');
  }

  await assertVersionInput(input);

  const versionData = {
    title: input.title,
    subtitle: input.subtitle,
    mainImageUrl: input.images[0],
    images: input.images,
    description: input.description,
    attributes: input.attributes,
  };

  const skus = input.skus.map(sku => ({
    skuCode: sku.skuCode,
    specs: sku.specs,
    price: sku.price,
    stock: sku.stock,
    status: sku.status,
  }));

  try {
    if (product.currentVersion.status === 'DRAFT') {
      // 草稿原地更新：版本号与版本 ID 保持不变，SKU 全量替换。
      // 条件写 `status: 'DRAFT'` 关闭「编辑与提交并发」时仍改写 SUBMITTED 版本的竞态。
      await prisma.$transaction(async tx => {
        const updated = await tx.productVersion.updateMany({
          where: { id: product.currentVersion.id, status: 'DRAFT' },
          data: versionData,
        });

        if (updated.count === 0) {
          throw new HttpError('PRODUCT_IN_REVIEW', 409, '商品审核中，无法编辑');
        }

        await tx.sku.deleteMany({ where: { productVersionId: product.currentVersion.id } });
        await tx.sku.createMany({
          data: skus.map(sku => ({ ...sku, productVersionId: product.currentVersion.id })),
        });
        await tx.product.update({
          where: { id },
          data: { categoryId: input.categoryId, brandId: input.brandId },
        });
      });
    } else {
      // 已审核/已发布等版本不可变，编辑产生新的 DRAFT 版本并切换当前指针。
      await prisma.$transaction(async tx => {
        const latest = await tx.productVersion.aggregate({
          where: { productId: id },
          _max: { version: true },
        });

        const created = await tx.productVersion.create({
          data: {
            productId: id,
            version: (latest._max.version ?? 0) + 1,
            status: 'DRAFT',
            ...versionData,
            createdBy: auth.userId,
            skus: { create: skus },
          },
        });

        await tx.product.update({
          where: { id },
          data: { categoryId: input.categoryId, brandId: input.brandId, currentVersionId: created.id },
        });
      });
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new HttpError('PRODUCT_VERSION_CONFLICT', 409, '商品版本冲突，请重试');
    }

    throw error;
  }

  return getProduct(auth, id);
}

export async function submitProduct(auth: ServiceTokenClaims, id: string): Promise<ProductDetailDTO> {
  const product = await getOwnedProductForWrite(auth, id);
  const versionId = product.currentVersion.id;
  const now = new Date();

  await prisma.$transaction(async tx => {
    const updated = await tx.productVersion.updateMany({
      where: { id: versionId, status: 'DRAFT' },
      data: { status: 'SUBMITTED', submittedAt: now },
    });

    if (updated.count === 0) {
      throw new HttpError('PRODUCT_NOT_DRAFT', 409, '只有草稿可以提交审核');
    }

    await tx.auditRecord.create({
      data: { productVersionId: versionId, status: 'PENDING', submitterId: auth.userId, submittedAt: now },
    });
  });

  return getProduct(auth, id);
}

export async function publishProduct(auth: ServiceTokenClaims, id: string): Promise<ProductDetailDTO> {
  const product = await getOwnedProductForWrite(auth, id);
  const current = product.currentVersion;

  if (current.status !== 'APPROVED') {
    throw new HttpError('PRODUCT_NOT_APPROVED', 409, '商品未通过审核，无法发布');
  }

  const now = new Date();
  const previousPublishedVersionId = product.publishedVersionId;

  await prisma.$transaction(async tx => {
    // 条件写关闭并发发布：只有一个事务能把该版本从 APPROVED 改为 PUBLISHED。
    const updated = await tx.productVersion.updateMany({
      where: { id: current.id, status: 'APPROVED' },
      data: { status: 'PUBLISHED', publishedAt: now },
    });

    if (updated.count === 0) {
      throw new HttpError('PRODUCT_NOT_APPROVED', 409, '商品未通过审核，无法发布');
    }

    if (previousPublishedVersionId && previousPublishedVersionId !== current.id) {
      await tx.productVersion.updateMany({
        where: { id: previousPublishedVersionId },
        data: { status: 'SUPERSEDED' },
      });
    }

    await tx.product.update({ where: { id }, data: { publishedVersionId: current.id } });
  });

  return getProduct(auth, id);
}

export async function offlineProduct(auth: ServiceTokenClaims, id: string): Promise<ProductDetailDTO> {
  const product = await getOwnedProductForWrite(auth, id);
  const publishedVersionId = product.publishedVersionId;

  if (!publishedVersionId) {
    throw new HttpError('PRODUCT_NOT_PUBLISHED', 409, '商品未发布，无法下线');
  }

  await prisma.$transaction(async tx => {
    // 只有仍处于 PUBLISHED 的版本才能下线；与发布交错时 0 行即冲突。
    const versionUpdated = await tx.productVersion.updateMany({
      where: { id: publishedVersionId, status: 'PUBLISHED' },
      data: { status: 'OFFLINE' },
    });

    if (versionUpdated.count === 0) {
      throw new HttpError('PRODUCT_NOT_PUBLISHED', 409, '商品未发布，无法下线');
    }

    // 仅当产品指针仍指向预期的线上版本时清空，避免覆盖并发发布。
    const productUpdated = await tx.product.updateMany({
      where: { id, publishedVersionId },
      data: { publishedVersionId: null },
    });

    if (productUpdated.count === 0) {
      throw new HttpError('PRODUCT_NOT_PUBLISHED', 409, '商品未发布，无法下线');
    }
  });

  return getProduct(auth, id);
}

export async function deleteProduct(auth: ServiceTokenClaims, id: string): Promise<void> {
  if (auth.portal !== 'merchant' || !auth.merchantId) {
    throw new HttpError('FORBIDDEN', 403, '无权访问');
  }

  const merchantId = auth.merchantId;

  await prisma.$transaction(async tx => {
    const product = await tx.product.findFirst({
      where: { id, deletedAt: null },
      include: { currentVersion: true },
    });

    if (!product || product.merchantId !== merchantId || !product.currentVersion) {
      throw productNotFound();
    }

    if (product.currentVersion.status === 'SUBMITTED') {
      throw new HttpError('PRODUCT_IN_REVIEW', 409, '商品审核中，无法删除');
    }

    if (product.publishedVersionId !== null) {
      throw new HttpError('PRODUCT_PUBLISHED', 409, '商品已发布，无法删除');
    }

    // 条件软删除：在读取与写入之间若有人提交/发布，count 为 0，随后按既有顺序复检错误码。
    const deleted = await tx.product.updateMany({
      where: {
        id,
        merchantId,
        deletedAt: null,
        publishedVersionId: null,
        currentVersion: { is: { status: { not: 'SUBMITTED' } } },
      },
      data: { deletedAt: new Date() },
    });

    if (deleted.count === 0) {
      const latest = await tx.product.findFirst({
        where: { id, deletedAt: null },
        include: { currentVersion: true },
      });

      if (!latest) {
        throw productNotFound();
      }

      if (latest.currentVersion?.status === 'SUBMITTED') {
        throw new HttpError('PRODUCT_IN_REVIEW', 409, '商品审核中，无法删除');
      }

      if (latest.publishedVersionId !== null) {
        throw new HttpError('PRODUCT_PUBLISHED', 409, '商品已发布，无法删除');
      }

      throw productNotFound();
    }
  });
}

function allowedOpsStatuses(status?: ProductVersionStatus): ProductVersionStatus[] {
  if (status) {
    return OPS_VISIBLE_SET.has(status) ? [status] : [];
  }

  return [...OPS_VISIBLE_STATUSES];
}

export async function listProducts(
  auth: ServiceTokenClaims,
  query: ProductQuery
): Promise<{ items: ProductListRowDTO[]; meta: PageMeta }> {
  const { page, pageSize, skip, take } = normalizePage(query);
  // 与 items 的 flatMap 口径保持一致：没有当前版本的商品不计入 total。
  const where: Prisma.ProductWhereInput = { deletedAt: null, currentVersionId: { not: null } };

  if (auth.portal === 'merchant') {
    where.merchantId = auth.merchantId ?? '__none__';

    if (query.status) {
      where.currentVersion = { is: { status: query.status } };
    }
  } else {
    const unrestricted = auth.permissions.includes(PERMISSIONS.PLATFORM_CROSS_TENANT) || auth.merchantScope === null;

    if (!unrestricted) {
      where.merchantId = { in: auth.merchantScope ?? [] };
    }

    where.currentVersion = { is: { status: { in: allowedOpsStatuses(query.status) } } };
  }

  if (query.keyword) {
    where.OR = [
      { code: { contains: query.keyword, mode: 'insensitive' } },
      { currentVersion: { is: { title: { contains: query.keyword, mode: 'insensitive' } } } },
    ];
  }

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        currentVersion: {
          select: { id: true, version: true, status: true, title: true, mainImageUrl: true },
        },
        publishedVersion: { select: { id: true } },
      },
      orderBy: [{ updatedAt: 'desc' }],
      skip,
      take,
    }),
  ]);

  const names = await loadNameMaps(products);
  const items = products.flatMap(product =>
    product.currentVersion ? [toProductRow(product, product.currentVersion, names)] : []
  );

  return { items, meta: { page, pageSize, total } };
}

export async function getProduct(auth: ServiceTokenClaims, id: string): Promise<ProductDetailDTO> {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      currentVersion: { include: { skus: true } },
      publishedVersion: { include: { skus: true } },
      versions: { orderBy: { version: 'desc' }, take: 20 },
    },
  });

  if (!product) {
    throw productNotFound();
  }

  if (auth.portal === 'merchant') {
    if (product.merchantId !== auth.merchantId) {
      throw productNotFound();
    }
  } else {
    assertMerchantVisible(auth, product.merchantId);

    if (!product.currentVersion || !OPS_VISIBLE_SET.has(product.currentVersion.status)) {
      throw productNotFound();
    }
  }

  const names = await loadNameMaps([product]);

  return toProductDetail(product, names);
}
