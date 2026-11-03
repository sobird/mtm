import type { BrandCreateInput, BrandDTO, BrandQuery, BrandUpdateInput, PageMeta } from '@mtm/contracts';

import { prisma } from '../db';
import { Prisma } from '../generated/prisma';
import { HttpError, normalizePage } from '../http';

type BrandRow = {
  id: string;
  name: string;
  logoUrl: string | null;
  status: 'ACTIVE' | 'DISABLED';
};

function toBrand(brand: BrandRow): BrandDTO {
  return {
    id: brand.id,
    name: brand.name,
    logoUrl: brand.logoUrl,
    status: brand.status,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function brandExists(): HttpError {
  return new HttpError('BRAND_EXISTS', 409, '品牌名称已存在');
}

export async function listBrands(query: BrandQuery): Promise<{ items: BrandDTO[]; meta: PageMeta }> {
  const { page, pageSize, skip, take } = normalizePage(query);
  const where: Prisma.BrandWhereInput = {};

  if (query.keyword) {
    where.name = { contains: query.keyword, mode: 'insensitive' };
  }

  if (query.status) {
    where.status = query.status;
  }

  const [total, brands] = await prisma.$transaction([
    prisma.brand.count({ where }),
    prisma.brand.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
  ]);

  return {
    items: brands.map(toBrand),
    meta: { page, pageSize, total },
  };
}

export async function createBrand(input: BrandCreateInput): Promise<BrandDTO> {
  try {
    const brand = await prisma.brand.create({
      data: {
        name: input.name,
        logoUrl: input.logoUrl ?? null,
        status: input.status,
      },
    });

    return toBrand(brand);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw brandExists();
    }

    throw error;
  }
}

export async function updateBrand(id: string, input: BrandUpdateInput): Promise<BrandDTO> {
  const existing = await prisma.brand.findUnique({ where: { id } });

  if (!existing) {
    throw new HttpError('BRAND_NOT_FOUND', 404, '品牌不存在');
  }

  try {
    const brand = await prisma.brand.update({
      where: { id },
      data: {
        name: input.name,
        logoUrl: input.logoUrl,
        status: input.status,
      },
    });

    return toBrand(brand);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw brandExists();
    }

    throw error;
  }
}
