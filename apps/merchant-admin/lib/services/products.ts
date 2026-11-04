import type {
  BrandDTO,
  CategoryNodeDTO,
  ProductCreateInput,
  ProductDetailDTO,
  ProductListRowDTO,
  ProductQuery,
  ProductUpdateInput,
} from '@mtm/contracts';

import { apiFetch, apiFetchWithMeta } from '@/lib/api-client';
import type { ApiResult } from '@/lib/api-client';

/** 分页默认值与 core-api 的 `paginationQuerySchema` 保持一致。 */
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/** 列表查询参数只暴露筛选字段，分页可省略。 */
export type ProductListParams = Partial<ProductQuery>;

/** 商品分页列表，返回 `data` 与分页 `meta`。 */
export function fetchProducts(params: ProductListParams = {}): Promise<ApiResult<ProductListRowDTO[]>> {
  return apiFetchWithMeta<ProductListRowDTO[]>('/api/bff/products', {
    query: { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE, ...params },
  });
}

/** 商品详情（含当前版本、已发布版本与版本历史）。 */
export function fetchProduct(id: string): Promise<ProductDetailDTO> {
  return apiFetch<ProductDetailDTO>(`/api/bff/products/${id}`);
}

/** 创建商品，返回创建后的详情。 */
export function createProduct(input: ProductCreateInput): Promise<ProductDetailDTO> {
  return apiFetch<ProductDetailDTO>('/api/bff/products', { method: 'POST', body: input });
}

/** 更新商品，已提交 / 已驳回商品由服务端创建新版本。 */
export function updateProduct(id: string, input: ProductUpdateInput): Promise<ProductDetailDTO> {
  return apiFetch<ProductDetailDTO>(`/api/bff/products/${id}`, { method: 'PATCH', body: input });
}

/** 提交审核。 */
export function submitProduct(id: string): Promise<ProductDetailDTO> {
  return apiFetch<ProductDetailDTO>(`/api/bff/products/${id}/submit`, { method: 'POST' });
}

/** 发布已通过审核的商品。 */
export function publishProduct(id: string): Promise<ProductDetailDTO> {
  return apiFetch<ProductDetailDTO>(`/api/bff/products/${id}/publish`, { method: 'POST' });
}

/** 下线已发布的商品。 */
export function offlineProduct(id: string): Promise<ProductDetailDTO> {
  return apiFetch<ProductDetailDTO>(`/api/bff/products/${id}/offline`, { method: 'POST' });
}

/** 删除草稿商品。 */
export function deleteProduct(id: string): Promise<null> {
  return apiFetch<null>(`/api/bff/products/${id}`, { method: 'DELETE' });
}

/** 商品表单使用的类目扁平树。 */
export function fetchProductCategories(): Promise<CategoryNodeDTO[]> {
  return apiFetch<CategoryNodeDTO[]>('/api/bff/categories/tree');
}

/** 商品表单使用的品牌选项；一次取满一页上限。 */
export async function fetchProductBrands(): Promise<BrandDTO[]> {
  const { data } = await apiFetchWithMeta<BrandDTO[]>('/api/bff/brands', {
    query: { page: DEFAULT_PAGE, pageSize: 100 },
  });

  return data;
}

/** 上传商品图片，返回资源 ID 与公开访问地址。 */
export function uploadProductImage(file: File): Promise<{ id: string; url: string }> {
  const form = new FormData();
  form.append('file', file);

  return apiFetch<{ id: string; url: string }>('/api/bff/uploads/images', { method: 'POST', body: form });
}
