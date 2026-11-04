import type { CategoryAttributeDTO } from '@mtm/contracts';
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
export function createProductFormSchema(mode: ProductFormMode, getAttributes: () => CategoryAttributeDTO[]) {
  return z
    .object({
      shopId: mode === 'create' ? z.string().trim().min(1, '请选择店铺') : z.string(),
      code:
        mode === 'create' ? z.string().trim().min(1, '请填写商品编码').max(50, '商品编码最多 50 个字符') : z.string(),
      categoryId: z.string().trim().min(1, '请选择类目'),
      brandId: z.string().nullable(),
      title: z.string().trim().min(1, '请填写商品标题').max(100, '商品标题最多 100 个字符'),
      subtitle: z.string().trim().max(100, '副标题最多 100 个字符'),
      images: z.array(z.string().min(1)).min(1, '请至少上传一张图片').max(MAX_IMAGES, `最多上传 ${MAX_IMAGES} 张图片`),
      description: z.string().trim().min(1, '请填写商品描述').max(5000, '商品描述最多 5000 个字符'),
      attributes: z.record(z.string(), z.string()),
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
        ctx.addIssue({ code: 'custom', path: ['skus'], message: '至少填写一个 SKU' });
      }

      const skuCodes = new Set<string>();

      value.skus.forEach((sku, index) => {
        if (sku.skuCode.trim() === '') {
          return;
        }

        const skuCode = sku.skuCode.trim();

        if (skuCode.length > 50) {
          ctx.addIssue({ code: 'custom', path: ['skus', index, 'skuCode'], message: 'SKU 编码最多 50 个字符' });
        }

        const normalized = skuCode.toLowerCase();

        if (skuCodes.has(normalized)) {
          ctx.addIssue({ code: 'custom', path: ['skus', index, 'skuCode'], message: 'SKU 编码重复' });
        }

        skuCodes.add(normalized);

        if (sku.specsText.trim().length > 50) {
          ctx.addIssue({ code: 'custom', path: ['skus', index, 'specsText'], message: '规格最多 50 个字符' });
        }

        if (sku.price.trim() === '' || !Number.isFinite(Number(sku.price)) || Number(sku.price) < 0) {
          ctx.addIssue({ code: 'custom', path: ['skus', index, 'price'], message: '请填写有效价格' });
        }

        if (sku.stock.trim() === '' || !Number.isInteger(Number(sku.stock)) || Number(sku.stock) < 0) {
          ctx.addIssue({ code: 'custom', path: ['skus', index, 'stock'], message: '请填写有效库存' });
        }
      });

      for (const attribute of getAttributes()) {
        const raw = value.attributes[attribute.id]?.trim() ?? '';

        if (raw === '') {
          if (attribute.required) {
            ctx.addIssue({ code: 'custom', path: ['attributes', attribute.id], message: '请填写该属性' });
          }

          continue;
        }

        if (attribute.type === 'NUMBER' && !Number.isFinite(Number(raw))) {
          ctx.addIssue({ code: 'custom', path: ['attributes', attribute.id], message: '请填写有效数字' });
        }

        if (attribute.type === 'SELECT' && !attribute.options.includes(raw)) {
          ctx.addIssue({ code: 'custom', path: ['attributes', attribute.id], message: '请选择有效选项' });
        }
      }
    });
}

export type ProductFormSchema = ReturnType<typeof createProductFormSchema>;
