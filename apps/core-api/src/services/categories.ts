import type { CategoryAttributeInput, CategoryCreateInput, CategoryNodeDTO, CategoryUpdateInput } from '@mtm/contracts';

import { prisma } from '../db';
import { Prisma } from '../generated/prisma';
import { HttpError } from '../http';

type CategoryRow = {
  id: string;
  parentId: string | null;
  name: string;
  level: number;
  path: string;
  sort: number;
  status: 'ACTIVE' | 'DISABLED';
  attributes: Array<{
    id: string;
    name: string;
    type: 'TEXT' | 'NUMBER' | 'SELECT';
    required: boolean;
    options: unknown;
    sort: number;
  }>;
};

function optionsOf(attribute: CategoryRow['attributes'][number]): string[] {
  if (!Array.isArray(attribute.options)) {
    return [];
  }

  return attribute.options.map(option => String(option));
}

function toCategoryNode(category: CategoryRow): CategoryNodeDTO {
  return {
    id: category.id,
    parentId: category.parentId,
    name: category.name,
    level: category.level,
    path: category.path,
    sort: category.sort,
    status: category.status,
    attributes: [...category.attributes]
      .sort((a, b) => a.sort - b.sort)
      .map(attribute => ({
        id: attribute.id,
        name: attribute.name,
        type: attribute.type,
        required: attribute.required,
        options: optionsOf(attribute),
        sort: attribute.sort,
      })),
  };
}

function attributeCreateData(categoryId: string, attribute: CategoryAttributeInput) {
  return {
    categoryId,
    name: attribute.name,
    type: attribute.type,
    required: attribute.required,
    options: attribute.options.length > 0 ? attribute.options : Prisma.JsonNull,
    sort: attribute.sort,
  };
}

export async function listCategoryNodes(): Promise<CategoryNodeDTO[]> {
  const categories = await prisma.category.findMany({
    include: { attributes: true },
    orderBy: [{ level: 'asc' }, { path: 'asc' }, { sort: 'asc' }],
  });

  return categories.map(toCategoryNode);
}

export async function createCategory(input: CategoryCreateInput): Promise<CategoryNodeDTO> {
  const parent = input.parentId ? await prisma.category.findUnique({ where: { id: input.parentId } }) : null;

  if (input.parentId && !parent) {
    throw new HttpError('CATEGORY_NOT_FOUND', 404, '父类目不存在');
  }

  if (parent && parent.level >= 3) {
    throw new HttpError('CATEGORY_LEVEL_LIMIT', 400, '类目最多三级');
  }

  return prisma.$transaction(async tx => {
    const created = await tx.category.create({
      data: {
        parentId: parent?.id ?? null,
        name: input.name,
        level: parent ? parent.level + 1 : 1,
        path: '',
        sort: input.sort,
        status: input.status,
      },
    });

    const path = parent ? `${parent.path}/${created.id}` : `/${created.id}`;
    await tx.category.update({ where: { id: created.id }, data: { path } });

    if (input.attributes.length > 0) {
      await tx.categoryAttribute.createMany({
        data: input.attributes.map(attribute => attributeCreateData(created.id, attribute)),
      });
    }

    const category = await tx.category.findUniqueOrThrow({
      where: { id: created.id },
      include: { attributes: true },
    });

    return toCategoryNode(category);
  });
}

export async function updateCategory(id: string, input: CategoryUpdateInput): Promise<CategoryNodeDTO> {
  const existing = await prisma.category.findUnique({ where: { id } });

  if (!existing) {
    throw new HttpError('CATEGORY_NOT_FOUND', 404, '类目不存在');
  }

  return prisma.$transaction(async tx => {
    await tx.category.update({
      where: { id },
      data: {
        name: input.name,
        sort: input.sort,
        status: input.status,
      },
    });

    if (input.attributes !== undefined) {
      const existingAttributes = await tx.categoryAttribute.findMany({
        where: { categoryId: id },
        select: { id: true },
      });
      const ownedIds = new Set(existingAttributes.map(attribute => attribute.id));
      const incomingIds = input.attributes.flatMap(attribute => (attribute.id ? [attribute.id] : []));

      if (incomingIds.some(attributeId => !ownedIds.has(attributeId))) {
        throw new HttpError('CATEGORY_ATTRIBUTE_INVALID', 400, '属性不属于该类目');
      }

      await tx.categoryAttribute.deleteMany({
        where: { categoryId: id, id: { notIn: incomingIds } },
      });

      await Promise.all(
        input.attributes.map(attribute => {
          const data = {
            name: attribute.name,
            type: attribute.type,
            required: attribute.required,
            options: attribute.options.length > 0 ? attribute.options : Prisma.JsonNull,
            sort: attribute.sort,
          };

          return attribute.id
            ? tx.categoryAttribute.update({ where: { id: attribute.id }, data })
            : tx.categoryAttribute.create({ data: { categoryId: id, ...data } });
        })
      );
    }

    const category = await tx.category.findUniqueOrThrow({
      where: { id },
      include: { attributes: true },
    });

    return toCategoryNode(category);
  });
}

export async function deleteCategory(id: string): Promise<void> {
  const existing = await prisma.category.findUnique({ where: { id } });

  if (!existing) {
    throw new HttpError('CATEGORY_NOT_FOUND', 404, '类目不存在');
  }

  const children = await prisma.category.count({ where: { parentId: id } });
  if (children > 0) {
    throw new HttpError('CATEGORY_HAS_CHILDREN', 409, '存在子类目，无法删除');
  }

  const products = await prisma.product.count({ where: { categoryId: id } });
  if (products > 0) {
    throw new HttpError('CATEGORY_IN_USE', 409, '类目已被商品使用，无法删除');
  }

  await prisma.$transaction([
    prisma.categoryAttribute.deleteMany({ where: { categoryId: id } }),
    prisma.category.delete({ where: { id } }),
  ]);
}
