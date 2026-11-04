import { DEMO_MERCHANT_ID } from '@mtm/contracts';

import type { PrismaClient } from '../src/generated/prisma';
import { Prisma } from '../src/generated/prisma';

/**
 * Version marker for the catalog + product demo seed. The version is
 * contractual: tests assert exactly one `SeedMeta` row for it and the seed may
 * run repeatedly without changing row counts.
 */
export const CORE_DATA_SEED_VERSION = '2026-11-04-core-products';

type MerchantSeed = {
  id: string;
  code: string;
  name: string;
  contactName: string;
  contactPhone: string;
};

type ShopSeed = {
  id: string;
  merchantId: string;
  name: string;
  description: string;
};

type CategorySeed = {
  id: string;
  name: string;
  parentId: string | null;
  sort: number;
};

type BrandSeed = {
  id: string;
  name: string;
};

type CategoryAttributeSeed = {
  id: string;
  categoryId: string;
  name: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT';
  required: boolean;
  options: string[] | null;
  sort: number;
};

const MERCHANTS: MerchantSeed[] = [
  {
    id: DEMO_MERCHANT_ID,
    code: 'M1001',
    name: '青禾家居有限公司',
    contactName: '林青禾',
    contactPhone: '13800001001',
  },
  {
    id: 'merchant-demo-2',
    code: 'M1002',
    name: '星河数码有限公司',
    contactName: '周星河',
    contactPhone: '13800001002',
  },
  {
    id: 'merchant-demo-3',
    code: 'M1003',
    name: '云岭食品有限公司',
    contactName: '陈云岭',
    contactPhone: '13800001003',
  },
];

const SHOPS: ShopSeed[] = [
  {
    id: 'shop-demo-1',
    merchantId: DEMO_MERCHANT_ID,
    name: '青禾家居旗舰店',
    description: '青禾家居官方旗舰店，主营家具与家纺。',
  },
  {
    id: 'shop-demo-2',
    merchantId: DEMO_MERCHANT_ID,
    name: '青禾生活馆',
    description: '青禾生活馆，精选居家好物。',
  },
  {
    id: 'shop-demo-3',
    merchantId: 'merchant-demo-2',
    name: '星河数码专营店',
    description: '星河数码专营店，专注手机与电脑周边。',
  },
  {
    id: 'shop-demo-4',
    merchantId: 'merchant-demo-3',
    name: '云岭食品旗舰店',
    description: '云岭食品旗舰店，山野好味。',
  },
];

// 4 一级 + 8 二级 + 11 三级 = 23，父子顺序保证 path 可由 parent 推导。
const CATEGORIES: CategorySeed[] = [
  { id: 'category-demo-home', name: '家居生活', parentId: null, sort: 10 },
  { id: 'category-demo-digital', name: '数码电器', parentId: null, sort: 20 },
  { id: 'category-demo-food', name: '食品饮料', parentId: null, sort: 30 },
  { id: 'category-demo-fashion', name: '服饰鞋包', parentId: null, sort: 40 },

  { id: 'category-demo-home-furniture', name: '家具', parentId: 'category-demo-home', sort: 10 },
  { id: 'category-demo-home-textile', name: '家纺', parentId: 'category-demo-home', sort: 20 },
  { id: 'category-demo-digital-phone', name: '手机通讯', parentId: 'category-demo-digital', sort: 10 },
  { id: 'category-demo-digital-computer', name: '电脑办公', parentId: 'category-demo-digital', sort: 20 },
  { id: 'category-demo-food-snacks', name: '休闲零食', parentId: 'category-demo-food', sort: 10 },
  { id: 'category-demo-food-drinks', name: '饮料冲调', parentId: 'category-demo-food', sort: 20 },
  { id: 'category-demo-fashion-men', name: '男装', parentId: 'category-demo-fashion', sort: 10 },
  { id: 'category-demo-fashion-women', name: '女装', parentId: 'category-demo-fashion', sort: 20 },

  { id: 'category-demo-home-sofa', name: '沙发', parentId: 'category-demo-home-furniture', sort: 10 },
  { id: 'category-demo-home-mattress', name: '床垫', parentId: 'category-demo-home-furniture', sort: 20 },
  { id: 'category-demo-home-bedding', name: '床品四件套', parentId: 'category-demo-home-textile', sort: 10 },
  { id: 'category-demo-home-curtain', name: '窗帘', parentId: 'category-demo-home-textile', sort: 20 },
  { id: 'category-demo-digital-smartphone', name: '智能手机', parentId: 'category-demo-digital-phone', sort: 10 },
  { id: 'category-demo-digital-accessory', name: '手机配件', parentId: 'category-demo-digital-phone', sort: 20 },
  { id: 'category-demo-digital-laptop', name: '笔记本电脑', parentId: 'category-demo-digital-computer', sort: 10 },
  { id: 'category-demo-food-nuts', name: '坚果炒货', parentId: 'category-demo-food-snacks', sort: 10 },
  { id: 'category-demo-food-coffee', name: '咖啡茶饮', parentId: 'category-demo-food-drinks', sort: 10 },
  { id: 'category-demo-fashion-shirt', name: '休闲衬衫', parentId: 'category-demo-fashion-men', sort: 10 },
  { id: 'category-demo-fashion-dress', name: '连衣裙', parentId: 'category-demo-fashion-women', sort: 10 },
];

const BRANDS: BrandSeed[] = [
  { id: 'brand-demo-1', name: '青禾' },
  { id: 'brand-demo-2', name: '星河' },
  { id: 'brand-demo-3', name: '云岭' },
  { id: 'brand-demo-4', name: '简木' },
  { id: 'brand-demo-5', name: '微光' },
  { id: 'brand-demo-6', name: '拾光' },
  { id: 'brand-demo-7', name: '蓝屿' },
  { id: 'brand-demo-8', name: '原野' },
  { id: 'brand-demo-9', name: '知味' },
  { id: 'brand-demo-10', name: '驰川' },
];

const CATEGORY_ATTRIBUTES: CategoryAttributeSeed[] = [
  {
    id: 'attr-demo-home-sofa-material',
    categoryId: 'category-demo-home-sofa',
    name: '材质',
    type: 'SELECT',
    required: true,
    options: ['棉麻', '真皮', '科技布'],
    sort: 10,
  },
  {
    id: 'attr-demo-home-sofa-size',
    categoryId: 'category-demo-home-sofa',
    name: '尺寸',
    type: 'TEXT',
    required: false,
    options: null,
    sort: 20,
  },
  {
    id: 'attr-demo-digital-smartphone-screen',
    categoryId: 'category-demo-digital-smartphone',
    name: '屏幕尺寸',
    type: 'NUMBER',
    required: true,
    options: null,
    sort: 10,
  },
  {
    id: 'attr-demo-digital-smartphone-color',
    categoryId: 'category-demo-digital-smartphone',
    name: '颜色',
    type: 'SELECT',
    required: false,
    options: ['曜石黑', '冰川白', '晨曦金'],
    sort: 20,
  },
];

const DEMO_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23e8eefc"/></svg>';

type ProductSeed = {
  id: string;
  shopId: string;
  categoryId: string;
  brandId: string;
  code: string;
  versionId: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REJECTED' | 'PUBLISHED';
  title: string;
  attributes: Record<string, string>;
  skus: Array<{ id: string; skuCode: string; specs: Record<string, string>; price: string; stock: number }>;
};

const PRODUCTS: ProductSeed[] = [
  {
    id: 'product-demo-1',
    shopId: 'shop-demo-1',
    categoryId: 'category-demo-home-sofa',
    brandId: 'brand-demo-1',
    code: 'P1001',
    versionId: 'pv-demo-1',
    status: 'PUBLISHED',
    title: '北欧三人位布艺沙发',
    attributes: { 'attr-demo-home-sofa-material': '棉麻', 'attr-demo-home-sofa-size': '三人位 200cm' },
    skus: [
      { id: 'sku-demo-1a', skuCode: 'P1001-A', specs: { spec: '三人位' }, price: '2599.00', stock: 12 },
      { id: 'sku-demo-1b', skuCode: 'P1001-B', specs: { spec: '双人位' }, price: '1999.00', stock: 8 },
    ],
  },
  {
    id: 'product-demo-2',
    shopId: 'shop-demo-1',
    categoryId: 'category-demo-digital-smartphone',
    brandId: 'brand-demo-2',
    code: 'P1002',
    versionId: 'pv-demo-2',
    status: 'SUBMITTED',
    title: '星河 5G 智能手机',
    attributes: { 'attr-demo-digital-smartphone-screen': '6.7', 'attr-demo-digital-smartphone-color': '曜石黑' },
    skus: [{ id: 'sku-demo-2a', skuCode: 'P1002-A', specs: { spec: '8GB+256GB' }, price: '3999.00', stock: 30 }],
  },
  {
    id: 'product-demo-3',
    shopId: 'shop-demo-1',
    categoryId: 'category-demo-food-coffee',
    brandId: 'brand-demo-3',
    code: 'P1003',
    versionId: 'pv-demo-3',
    status: 'REJECTED',
    title: '云岭手冲咖啡豆',
    attributes: {},
    skus: [{ id: 'sku-demo-3a', skuCode: 'P1003-A', specs: { spec: '250g' }, price: '89.00', stock: 50 }],
  },
  {
    id: 'product-demo-4',
    shopId: 'shop-demo-2',
    categoryId: 'category-demo-fashion-dress',
    brandId: 'brand-demo-4',
    code: 'P1004',
    versionId: 'pv-demo-4',
    status: 'DRAFT',
    title: '夏季碎花连衣裙',
    attributes: {},
    skus: [{ id: 'sku-demo-4a', skuCode: 'P1004-A', specs: { spec: 'M' }, price: '299.00', stock: 20 }],
  },
];

/** Version timestamps are derived from status so repeated seeds stay stable. */
function productTimestamps(status: ProductSeed['status']): {
  submittedAt: Date | null;
  reviewedAt: Date | null;
  publishedAt: Date | null;
} {
  switch (status) {
    case 'PUBLISHED':
      return {
        submittedAt: new Date('2026-11-04T08:00:00.000Z'),
        reviewedAt: new Date('2026-11-04T08:30:00.000Z'),
        publishedAt: new Date('2026-11-04T09:00:00.000Z'),
      };
    case 'SUBMITTED':
      return {
        submittedAt: new Date('2026-11-04T09:00:00.000Z'),
        reviewedAt: null,
        publishedAt: null,
      };
    case 'REJECTED':
      return {
        submittedAt: new Date('2026-11-04T09:30:00.000Z'),
        reviewedAt: new Date('2026-11-04T10:00:00.000Z'),
        publishedAt: null,
      };
    case 'DRAFT':
      return { submittedAt: null, reviewedAt: null, publishedAt: null };
  }
}

/**
 * Seeds the catalog master data and demo products used by `commerce_core`
 * tests and the local demo. Every write is an upsert keyed by a fixed readable
 * id (or `code` / `name`), so repeated runs keep the exact same row counts.
 */
export async function seedCoreData(client: PrismaClient): Promise<void> {
  await Promise.all(
    MERCHANTS.map(merchant =>
      client.merchant.upsert({
        where: { code: merchant.code },
        update: {
          name: merchant.name,
          contactName: merchant.contactName,
          contactPhone: merchant.contactPhone,
        },
        create: merchant,
      })
    )
  );

  await Promise.all(
    SHOPS.map(shop =>
      client.shop.upsert({
        where: { id: shop.id },
        update: {
          merchantId: shop.merchantId,
          name: shop.name,
          description: shop.description,
        },
        create: shop,
      })
    )
  );

  // Paths are derived synchronously in parent-before-child order, then written
  // in parallel; a category's path never depends on a database round-trip.
  const categoryPaths = new Map<string, { level: number; path: string }>();
  const categories = CATEGORIES.map(category => {
    const parent = category.parentId ? categoryPaths.get(category.parentId) : undefined;
    const level = parent ? parent.level + 1 : 1;
    const path = parent ? `${parent.path}/${category.id}` : `/${category.id}`;
    categoryPaths.set(category.id, { level, path });
    return {
      id: category.id,
      name: category.name,
      parentId: category.parentId,
      sort: category.sort,
      level,
      path,
    };
  });

  // A category's parent must exist before the child row is written, so batch
  // writes by level. Categories are capped at three levels by the schema.
  const upsertCategories = (level: number) =>
    Promise.all(
      categories
        .filter(category => category.level === level)
        .map(category =>
          client.category.upsert({
            where: { id: category.id },
            update: {
              name: category.name,
              parentId: category.parentId,
              sort: category.sort,
              level: category.level,
              path: category.path,
            },
            create: category,
          })
        )
    );

  await upsertCategories(1);
  await upsertCategories(2);
  await upsertCategories(3);

  await Promise.all(
    CATEGORY_ATTRIBUTES.map(attribute => {
      const data = {
        categoryId: attribute.categoryId,
        name: attribute.name,
        type: attribute.type,
        required: attribute.required,
        options: attribute.options ?? Prisma.JsonNull,
        sort: attribute.sort,
      };

      return client.categoryAttribute.upsert({
        where: { id: attribute.id },
        update: data,
        create: { id: attribute.id, ...data },
      });
    })
  );

  await Promise.all(
    BRANDS.map(brand =>
      client.brand.upsert({
        where: { name: brand.name },
        update: {},
        create: brand,
      })
    )
  );

  // 商品、版本、SKU 与审核记录均按固定 ID upsert；版本在商品之后创建，SKU
  // 与审核记录在版本之后创建，指针最后回写，保证重复执行不增行。
  await Promise.all(
    PRODUCTS.map(async product => {
      const timestamps = productTimestamps(product.status);
      const versionData = {
        productId: product.id,
        version: 1,
        status: product.status,
        title: product.title,
        subtitle: null,
        mainImageUrl: DEMO_IMAGE,
        images: [DEMO_IMAGE],
        description: '演示商品',
        attributes: product.attributes,
        createdBy: 'merchant-account-owner',
        ...timestamps,
      };

      await client.product.upsert({
        where: { id: product.id },
        update: {
          merchantId: DEMO_MERCHANT_ID,
          shopId: product.shopId,
          categoryId: product.categoryId,
          brandId: product.brandId,
          code: product.code,
        },
        create: {
          id: product.id,
          merchantId: DEMO_MERCHANT_ID,
          shopId: product.shopId,
          categoryId: product.categoryId,
          brandId: product.brandId,
          code: product.code,
        },
      });

      await client.productVersion.upsert({
        where: { id: product.versionId },
        update: versionData,
        create: { id: product.versionId, ...versionData },
      });
    })
  );

  await Promise.all(
    PRODUCTS.flatMap(product =>
      product.skus.map(sku => {
        const data = {
          productVersionId: product.versionId,
          skuCode: sku.skuCode,
          specs: sku.specs,
          price: sku.price,
          stock: sku.stock,
          status: 'ACTIVE' as const,
        };

        return client.sku.upsert({
          where: { id: sku.id },
          update: data,
          create: { id: sku.id, ...data },
        });
      })
    )
  );

  await Promise.all(
    PRODUCTS.map(product =>
      client.product.update({
        where: { id: product.id },
        data: {
          currentVersionId: product.versionId,
          publishedVersionId: product.status === 'PUBLISHED' ? product.versionId : null,
        },
      })
    )
  );

  await Promise.all([
    client.auditRecord.upsert({
      where: { id: 'audit-demo-2' },
      update: {
        productVersionId: 'pv-demo-2',
        status: 'PENDING',
        submitterId: 'merchant-account-owner',
        reviewerId: null,
        comment: null,
        submittedAt: new Date('2026-11-04T09:00:00.000Z'),
        reviewedAt: null,
      },
      create: {
        id: 'audit-demo-2',
        productVersionId: 'pv-demo-2',
        status: 'PENDING',
        submitterId: 'merchant-account-owner',
        submittedAt: new Date('2026-11-04T09:00:00.000Z'),
      },
    }),
    client.auditRecord.upsert({
      where: { id: 'audit-demo-3' },
      update: {
        productVersionId: 'pv-demo-3',
        status: 'REJECTED',
        submitterId: 'merchant-account-owner',
        reviewerId: 'ops-demo',
        comment: '商品描述不完整',
        submittedAt: new Date('2026-11-04T09:30:00.000Z'),
        reviewedAt: new Date('2026-11-04T10:00:00.000Z'),
      },
      create: {
        id: 'audit-demo-3',
        productVersionId: 'pv-demo-3',
        status: 'REJECTED',
        submitterId: 'merchant-account-owner',
        reviewerId: 'ops-demo',
        comment: '商品描述不完整',
        submittedAt: new Date('2026-11-04T09:30:00.000Z'),
        reviewedAt: new Date('2026-11-04T10:00:00.000Z'),
      },
    }),
  ]);

  await client.seedMeta.upsert({
    where: { version: CORE_DATA_SEED_VERSION },
    update: {},
    create: { version: CORE_DATA_SEED_VERSION },
  });
}
