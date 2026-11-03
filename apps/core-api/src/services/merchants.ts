import type { ServiceTokenClaims } from '@mtm/auth/service-token';
import {
  PERMISSIONS,
  type MerchantDetailDTO,
  type MerchantDTO,
  type MerchantQuery,
  type MerchantUpdateInput,
  type PageMeta,
  type ShopDTO,
  type ShopQuery,
  type ShopUpdateInput,
} from '@mtm/contracts';

import { prisma } from '../db';
import { Prisma } from '../generated/prisma';
import { HttpError, assertMerchantVisible, normalizePage } from '../http';

type MerchantRow = {
  id: string;
  code: string;
  name: string;
  status: 'ACTIVE' | 'DISABLED';
  contactName: string | null;
  contactPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ShopRow = {
  id: string;
  merchantId: string;
  name: string;
  logoUrl: string | null;
  status: 'ACTIVE' | 'DISABLED';
  description: string | null;
  externalLink: string | null;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  createdAt: Date;
};

type MerchantWithShops = MerchantRow & { shops: ShopRow[] };

function toMerchant(merchant: MerchantRow): MerchantDTO {
  return {
    id: merchant.id,
    code: merchant.code,
    name: merchant.name,
    status: merchant.status,
    contactName: merchant.contactName,
    contactPhone: merchant.contactPhone,
    createdAt: merchant.createdAt.toISOString(),
    updatedAt: merchant.updatedAt.toISOString(),
  };
}

function toShop(shop: ShopRow): ShopDTO {
  return {
    id: shop.id,
    merchantId: shop.merchantId,
    name: shop.name,
    logoUrl: shop.logoUrl,
    status: shop.status,
    description: shop.description,
    externalLink: shop.externalLink,
    address: shop.address,
    contactName: shop.contactName,
    contactPhone: shop.contactPhone,
    createdAt: shop.createdAt.toISOString(),
  };
}

function toMerchantDetail(merchant: MerchantWithShops): MerchantDetailDTO {
  return { ...toMerchant(merchant), shops: merchant.shops.map(toShop) };
}

/**
 * `null` means the caller may see every merchant (cross-tenant ops or an
 * unrestricted scope). Otherwise the returned ids are the only visible
 * merchants; an empty array deliberately produces an empty page.
 */
function visibleMerchantIds(auth: ServiceTokenClaims): string[] | null {
  if (auth.permissions.includes(PERMISSIONS.PLATFORM_CROSS_TENANT) || auth.merchantScope === null) {
    return null;
  }

  return auth.merchantScope;
}

function merchantWhere(auth: ServiceTokenClaims): Prisma.MerchantWhereInput {
  const ids = visibleMerchantIds(auth);
  return ids === null ? {} : { id: { in: ids } };
}

function shopWhere(auth: ServiceTokenClaims): Prisma.ShopWhereInput {
  const ids = visibleMerchantIds(auth);
  return ids === null ? {} : { merchantId: { in: ids } };
}

function merchantNotFound(): HttpError {
  return new HttpError('MERCHANT_NOT_FOUND', 404, '商家不存在');
}

function shopNotFound(): HttpError {
  return new HttpError('SHOP_NOT_FOUND', 404, '店铺不存在');
}

export async function listMerchants(
  auth: ServiceTokenClaims,
  query: MerchantQuery
): Promise<{ items: MerchantDTO[]; meta: PageMeta }> {
  const { page, pageSize, skip, take } = normalizePage(query);
  const where = merchantWhere(auth);

  if (query.keyword) {
    where.OR = [
      { name: { contains: query.keyword, mode: 'insensitive' } },
      { code: { contains: query.keyword, mode: 'insensitive' } },
    ];
  }

  if (query.status) {
    where.status = query.status;
  }

  const [total, merchants] = await prisma.$transaction([
    prisma.merchant.count({ where }),
    prisma.merchant.findMany({ where, orderBy: { code: 'asc' }, skip, take }),
  ]);

  return {
    items: merchants.map(toMerchant),
    meta: { page, pageSize, total },
  };
}

export async function getMerchantDetail(auth: ServiceTokenClaims, id: string): Promise<MerchantDetailDTO> {
  const merchant = await prisma.merchant.findUnique({
    where: { id },
    include: { shops: { orderBy: { name: 'asc' } } },
  });

  if (!merchant) {
    throw merchantNotFound();
  }

  assertMerchantVisible(auth, merchant.id);

  return toMerchantDetail(merchant);
}

export async function getMyMerchant(merchantId: string): Promise<MerchantDetailDTO> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: { shops: { orderBy: { name: 'asc' } } },
  });

  if (!merchant) {
    throw merchantNotFound();
  }

  return toMerchantDetail(merchant);
}

export async function updateMyMerchant(merchantId: string, input: MerchantUpdateInput): Promise<MerchantDTO> {
  const existing = await prisma.merchant.findUnique({ where: { id: merchantId } });

  if (!existing) {
    throw merchantNotFound();
  }

  // Only the whitelisted schema fields reach the update; ids from the body are
  // stripped by Zod and never consulted.
  const merchant = await prisma.merchant.update({ where: { id: merchantId }, data: input });

  return toMerchant(merchant);
}

export async function listShops(
  auth: ServiceTokenClaims,
  query: ShopQuery
): Promise<{ items: ShopDTO[]; meta: PageMeta }> {
  const { page, pageSize, skip, take } = normalizePage(query);
  const where = shopWhere(auth);

  if (query.keyword) {
    where.name = { contains: query.keyword, mode: 'insensitive' };
  }

  if (query.status) {
    where.status = query.status;
  }

  const [total, shops] = await prisma.$transaction([
    prisma.shop.count({ where }),
    prisma.shop.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
  ]);

  return {
    items: shops.map(toShop),
    meta: { page, pageSize, total },
  };
}

export async function getShop(auth: ServiceTokenClaims, id: string): Promise<ShopDTO> {
  const shop = await prisma.shop.findUnique({ where: { id } });

  if (!shop) {
    throw shopNotFound();
  }

  assertMerchantVisible(auth, shop.merchantId);

  return toShop(shop);
}

export async function updateShop(id: string, merchantId: string, input: ShopUpdateInput): Promise<ShopDTO> {
  const existing = await prisma.shop.findUnique({ where: { id } });

  if (!existing) {
    throw shopNotFound();
  }

  if (existing.merchantId !== merchantId) {
    throw new HttpError('FORBIDDEN', 403, '无权修改该店铺');
  }

  const shop = await prisma.shop.update({ where: { id }, data: input });

  return toShop(shop);
}
