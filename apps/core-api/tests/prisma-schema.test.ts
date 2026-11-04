import { beforeEach, expect, test } from 'vitest';

import { prisma } from '@/src/db';

import { resetCoreFixtures } from './helpers';

beforeEach(resetCoreFixtures);

test('商品可关联当前版本与已发布版本', async () => {
  const product = await prisma.product.create({
    data: { merchantId: 'merchant-x', shopId: 'shop-x', categoryId: 'category-x', code: 'SCHEMA-1' },
  });
  const version = await prisma.productVersion.create({
    data: {
      productId: product.id,
      version: 1,
      title: '测试商品',
      mainImageUrl: 'data:image/svg+xml;utf8,<svg/>',
      images: [],
      description: '描述',
      attributes: {},
      createdBy: 'account-x',
    },
  });

  await prisma.product.update({
    where: { id: product.id },
    data: { currentVersionId: version.id, publishedVersionId: version.id },
  });

  const loaded = await prisma.product.findUniqueOrThrow({
    where: { id: product.id },
    include: { currentVersion: true, publishedVersion: true },
  });

  expect(loaded.currentVersion?.id).toBe(version.id);
  expect(loaded.publishedVersion?.id).toBe(version.id);
});

test('同一商品的版本号唯一', async () => {
  const product = await prisma.product.create({
    data: { merchantId: 'merchant-x', shopId: 'shop-x', categoryId: 'category-x', code: 'SCHEMA-2' },
  });
  const data = {
    productId: product.id,
    version: 1,
    title: '测试商品',
    mainImageUrl: 'data:image/svg+xml;utf8,<svg/>',
    images: [],
    description: '描述',
    attributes: {},
    createdBy: 'account-x',
  };

  await prisma.productVersion.create({ data });
  await expect(prisma.productVersion.create({ data })).rejects.toThrow();
});
