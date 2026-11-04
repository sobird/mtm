import type { ProductCreateInput, ProductVersionInput } from '@mtm/contracts';

/** 商家端商品表单的可编辑状态。 */
export interface ProductFormState {
  categoryId: string;
  brandId: string | null;
  title: string;
  subtitle: string;
  images: string[];
  description: string;
  attributes: Record<string, string>;
  skus: Array<{ skuCode: string; specsText: string; price: string; stock: string; status: 'ACTIVE' | 'DISABLED' }>;
}

/** SKU 表单行转契约输入；空规格文本映射为空对象。 */
function toSkuInput(sku: ProductFormState['skus'][number]) {
  const specsText = sku.specsText.trim();

  return {
    skuCode: sku.skuCode.trim(),
    specs: specsText === '' ? {} : { 规格: specsText },
    price: Number(sku.price),
    stock: Number(sku.stock),
    status: sku.status,
  };
}

/**
 * 把表单状态转换为版本输入。
 *
 * - 空 `brandId` / `subtitle` 转为 `null`；
 * - 过滤 `skuCode` 为空的 SKU 行；全部为空时返回空数组，交由表单校验拦截；
 * - 主图由服务端取 `images[0]`，这里保留顺序。
 */
export function buildVersionInput(state: ProductFormState): ProductVersionInput {
  const skus = state.skus.filter(sku => sku.skuCode.trim() !== '').map(toSkuInput);

  return {
    categoryId: state.categoryId.trim(),
    brandId: state.brandId?.trim() || null,
    title: state.title.trim(),
    subtitle: state.subtitle.trim() ? state.subtitle.trim() : null,
    images: [...state.images],
    description: state.description.trim(),
    attributes: { ...state.attributes },
    skus,
  };
}

/** 创建输入在版本输入之外附加店铺与商品编码。 */
export function buildCreateInput(state: ProductFormState, shopId: string, code: string): ProductCreateInput {
  return {
    ...buildVersionInput(state),
    shopId: shopId.trim(),
    code: code.trim(),
  };
}
