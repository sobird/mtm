import type { CategoryAttributeDTO } from '@mtm/contracts';
import type { Translate } from '@mtm/i18n';
import { z } from 'zod';

export const MAX_IMAGES = 5;

export const SKU_STATUSES = ['ACTIVE', 'DISABLED'] as const;

export interface SkuFormRow {
  skuCode: string;
  specsText: string;
  price: string;
  stock: string;
  status: 'ACTIVE' | 'DISABLED';
}

/** 商品表单值；创建模式额外包含店铺与商品编码。 */
export interface ProductFormValues {
  shopId: string;
  code: string;
  categoryId: string;
  brandId: string | null;
  title: string;
  subtitle: string;
  images: string[];
  description: string;
  attributes: Record<string, string>;
  skus: SkuFormRow[];
}

export type ProductFormMode = 'create' | 'edit';

/**
 * 构造商品表单 schema。
 *
 * 类目属性随选中类目变化，schema 在表单挂载时创建一次，通过 `getAttributes`
 * 在每次校验时读取当前类目属性，避免重建表单丢失输入。
 */
export function createProductFormSchema(
  mode: ProductFormMode,
  getAttributes: () => CategoryAttributeDTO[],
  t: Translate
) {
  return z
    .object({
      shopId: mode === 'create' ? z.string().trim().min(1, t('validation.productShopRequired')) : z.string(),
      code:
        mode === 'create'
          ? z
              .string()
              .trim()
              .min(1, t('validation.productCodeRequired'))
              .max(50, t('validation.productCodeMax', { max: 50 }))
          : z.string(),
      categoryId: z.string().trim().min(1, t('validation.productCategoryRequired')),
      brandId: z.string().nullable(),
      title: z
        .string()
        .trim()
        .min(1, t('validation.productTitleRequired'))
        .max(100, t('validation.productTitleMax', { max: 100 })),
      subtitle: z
        .string()
        .trim()
        .max(100, t('validation.productSubtitleMax', { max: 100 })),
      images: z
        .array(z.string().min(1))
        .min(1, t('validation.productImagesRequired'))
        .max(MAX_IMAGES, t('validation.productImagesMax', { max: MAX_IMAGES })),
      description: z
        .string()
        .trim()
        .min(1, t('validation.productDescriptionRequired'))
        .max(5000, t('validation.productDescriptionMax', { max: 5000 })),
      // react-hook-form keeps own keys for untouched attribute Controllers with `undefined`
      // values; drop those before the record check so blank optional attributes do not fail
      // with Zod's default message. Empty strings stay and are handled as blank below.
      attributes: z.preprocess(
        value => {
          if (!value || typeof value !== 'object') {
            return {};
          }

          return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).filter(([, item]) => item !== undefined)
          );
        },
        z.record(z.string(), z.string())
      ),
      skus: z.array(
        z.object({
          skuCode: z.string(),
          specsText: z.string(),
          price: z.string(),
          stock: z.string(),
          status: z.enum(SKU_STATUSES),
        })
      ),
    })
    .superRefine((value, ctx) => {
      const filledSkus = value.skus.filter(sku => sku.skuCode.trim() !== '');

      if (filledSkus.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['skus'], message: t('validation.skuRequired') });
      }

      const skuCodes = new Set<string>();

      value.skus.forEach((sku, index) => {
        if (sku.skuCode.trim() === '') {
          return;
        }

        const skuCode = sku.skuCode.trim();

        if (skuCode.length > 50) {
          ctx.addIssue({
            code: 'custom',
            path: ['skus', index, 'skuCode'],
            message: t('validation.skuCodeMax', { max: 50 }),
          });
        }

        const normalized = skuCode.toLowerCase();

        if (skuCodes.has(normalized)) {
          ctx.addIssue({ code: 'custom', path: ['skus', index, 'skuCode'], message: t('validation.skuCodeDuplicate') });
        }

        skuCodes.add(normalized);

        if (sku.specsText.trim().length > 50) {
          ctx.addIssue({
            code: 'custom',
            path: ['skus', index, 'specsText'],
            message: t('validation.skuSpecsMax', { max: 50 }),
          });
        }

        if (sku.price.trim() === '' || !Number.isFinite(Number(sku.price)) || Number(sku.price) < 0) {
          ctx.addIssue({ code: 'custom', path: ['skus', index, 'price'], message: t('validation.skuPriceInvalid') });
        }

        if (sku.stock.trim() === '' || !Number.isInteger(Number(sku.stock)) || Number(sku.stock) < 0) {
          ctx.addIssue({ code: 'custom', path: ['skus', index, 'stock'], message: t('validation.skuStockInvalid') });
        }
      });

      for (const attribute of getAttributes()) {
        const raw = value.attributes[attribute.id]?.trim() ?? '';

        if (raw === '') {
          if (attribute.required) {
            ctx.addIssue({
              code: 'custom',
              path: ['attributes', attribute.id],
              message: t('validation.attributeRequired'),
            });
          }

          continue;
        }

        if (attribute.type === 'NUMBER' && !Number.isFinite(Number(raw))) {
          ctx.addIssue({
            code: 'custom',
            path: ['attributes', attribute.id],
            message: t('validation.attributeNumberInvalid'),
          });
        }

        if (attribute.type === 'SELECT' && !attribute.options.includes(raw)) {
          ctx.addIssue({
            code: 'custom',
            path: ['attributes', attribute.id],
            message: t('validation.attributeOptionInvalid'),
          });
        }
      }
    });
}

export type ProductFormSchema = ReturnType<typeof createProductFormSchema>;
