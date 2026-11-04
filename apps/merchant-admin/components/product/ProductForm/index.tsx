'use client';

import type { ProductDetailDTO, ProductVersionInput, ProductVersionStatus } from '@mtm/contracts';
import { PERMISSIONS } from '@mtm/contracts';
import { usePermissions } from '@mtm/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

import { PageContainer } from '@/components/layout/PageContainer';
import { Button, Empty, Field, Input, Select, Skeleton, Tag, Textarea, useToast } from '@/components/ui';
import type { SelectOption, SelectOptionValue, TagTone } from '@/components/ui';
import { ApiError } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import {
  createProduct,
  fetchProduct,
  fetchProductBrands,
  fetchProductCategories,
  offlineProduct,
  publishProduct,
  submitProduct,
  updateProduct,
} from '@/lib/services/products';
import { fetchMyMerchant } from '@/lib/services/shop-profile';

import AttributeFields from '../AttributeFields';
import ProductImageField from '../ProductImageField';
import { createEmptySku, SkuEditor } from '../SkuEditor';
import { buildCreateInput, buildVersionInput } from './payload';
import type { ProductFormState } from './payload';

import styles from './index.module.css';

export type ProductFormProps = { mode: 'create' } | { mode: 'edit'; productId: string };

const STATUS_META: Record<ProductVersionStatus, { label: string; tone: TagTone }> = {
  DRAFT: { label: '草稿', tone: 'neutral' },
  SUBMITTED: { label: '审核中', tone: 'warning' },
  APPROVED: { label: '已通过', tone: 'success' },
  REJECTED: { label: '已驳回', tone: 'danger' },
  PUBLISHED: { label: '已发布', tone: 'success' },
  SUPERSEDED: { label: '已被替换', tone: 'neutral' },
  OFFLINE: { label: '已下线', tone: 'danger' },
};

const formSchema = z.object({
  categoryId: z.string().trim().min(1, '请选择类目'),
  brandId: z.string().nullable(),
  title: z.string().trim().min(1, '请填写商品标题').max(100, '商品标题最多 100 个字符'),
  subtitle: z.string().trim().max(100, '副标题最多 100 个字符'),
  images: z.array(z.string().min(1)).min(1, '请至少上传一张图片').max(5, '最多上传 5 张图片'),
  description: z.string().trim().min(1, '请填写商品描述').max(5000, '商品描述最多 5000 个字符'),
  attributes: z.record(z.string(), z.string()),
  skus: z.array(
    z.object({
      skuCode: z.string(),
      specsText: z.string(),
      price: z.string(),
      stock: z.string(),
      status: z.enum(['ACTIVE', 'DISABLED']),
    })
  ),
});

function emptyState(): ProductFormState {
  return {
    categoryId: '',
    brandId: '',
    title: '',
    subtitle: '',
    images: [],
    description: '',
    attributes: {},
    skus: [createEmptySku()],
  };
}

/** 商品详情回填为表单状态；规格取第一个值。 */
function toFormState(product: ProductDetailDTO): ProductFormState {
  const version = product.currentVersion;

  return {
    categoryId: product.categoryId,
    brandId: product.brandId ?? '',
    title: version.title,
    subtitle: version.subtitle ?? '',
    images: [...version.images],
    description: version.description,
    attributes: { ...version.attributes },
    skus: version.skus.map(sku => ({
      skuCode: sku.skuCode,
      specsText: Object.values(sku.specs)[0] ?? '',
      price: sku.price,
      stock: String(sku.stock),
      status: sku.status,
    })),
  };
}

interface ValidationContext {
  mode: 'create' | 'edit';
  shopId: string;
  code: string;
  requiredAttributeIds: string[];
}

function validateForm(state: ProductFormState, context: ValidationContext): Record<string, string> {
  const errors: Record<string, string> = {};
  const parsed = formSchema.safeParse(state);

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.');
      errors[key] ??= issue.message;
    }
  }

  if (context.mode === 'create') {
    if (!context.shopId.trim()) {
      errors.shopId = '请选择店铺';
    }

    if (!context.code.trim()) {
      errors.code = '请填写商品编码';
    } else if (context.code.trim().length > 50) {
      errors.code = '商品编码最多 50 个字符';
    }
  }

  const filledSkus = state.skus.filter(sku => sku.skuCode.trim() !== '');

  if (filledSkus.length === 0) {
    errors.skus = '至少填写一个 SKU';
  }

  const skuCodes = new Set<string>();

  state.skus.forEach((sku, index) => {
    if (sku.skuCode.trim() === '') {
      return;
    }

    if (sku.skuCode.trim().length > 50) {
      errors[`skus.${index}.skuCode`] ??= 'SKU 编码最多 50 个字符';
    }

    const normalized = sku.skuCode.trim().toLowerCase();

    if (skuCodes.has(normalized)) {
      errors[`skus.${index}.skuCode`] ??= 'SKU 编码重复';
    }

    skuCodes.add(normalized);

    if (sku.price.trim() === '' || !Number.isFinite(Number(sku.price)) || Number(sku.price) < 0) {
      errors[`skus.${index}.price`] ??= '请填写有效价格';
    }

    if (sku.stock.trim() === '' || !Number.isInteger(Number(sku.stock)) || Number(sku.stock) < 0) {
      errors[`skus.${index}.stock`] ??= '请填写有效库存';
    }
  });

  for (const attributeId of context.requiredAttributeIds) {
    if (!state.attributes[attributeId]?.trim()) {
      errors[`attributes.${attributeId}`] ??= '请填写该属性';
    }
  }

  return errors;
}

export function ProductForm(props: ProductFormProps) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const mode = props.mode;
  const productId = props.mode === 'edit' ? props.productId : '';
  const isEdit = props.mode === 'edit';

  const [state, setState] = useState<ProductFormState>(emptyState);
  const [shopId, setShopId] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hydratedVersion = useRef<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: queryKeys.productCategories,
    queryFn: fetchProductCategories,
  });
  const brandsQuery = useQuery({
    queryKey: queryKeys.productBrands,
    queryFn: fetchProductBrands,
  });
  const merchantQuery = useQuery({
    queryKey: queryKeys.myMerchant,
    queryFn: fetchMyMerchant,
    enabled: mode === 'create',
  });
  const productQuery = useQuery({
    queryKey: queryKeys.product(productId),
    queryFn: () => fetchProduct(productId),
    enabled: isEdit,
  });

  const product = isEdit ? productQuery.data : undefined;
  const shops = merchantQuery.data?.shops ?? [];

  useEffect(() => {
    if (!isEdit || !product) {
      return;
    }

    if (hydratedVersion.current === product.currentVersion.id) {
      return;
    }

    hydratedVersion.current = product.currentVersion.id;
    setState(toFormState(product));
    setCode(product.code);
  }, [isEdit, product]);

  useEffect(() => {
    if (mode !== 'create' || shopId !== '') {
      return;
    }

    const firstShop = merchantQuery.data?.shops[0];

    if (firstShop) {
      setShopId(firstShop.id);
    }
  }, [mode, shopId, merchantQuery.data]);

  const selectedCategory = useMemo(
    () => categoriesQuery.data?.find(category => category.id === state.categoryId),
    [categoriesQuery.data, state.categoryId]
  );
  const categoryAttributes = selectedCategory?.attributes ?? [];

  const status = product?.status;
  const submitted = isEdit && status === 'SUBMITTED';
  const canCreate = permissions.has(PERMISSIONS.PRODUCT_CREATE);
  const canUpdate = permissions.has(PERMISSIONS.PRODUCT_UPDATE);
  const canSubmit = permissions.has(PERMISSIONS.PRODUCT_SUBMIT);
  const canPublish = permissions.has(PERMISSIONS.PRODUCT_PUBLISH);
  const readOnly = isEdit ? submitted || !canUpdate : false;
  const canSave = isEdit ? canUpdate && !submitted : canCreate;
  const showSubmit = isEdit && status === 'DRAFT' && canSubmit;
  const showPublish = isEdit && status === 'APPROVED' && canPublish;
  const showOffline = isEdit && status === 'PUBLISHED' && canPublish;

  const invalidateProducts = async () => {
    await queryClient.invalidateQueries({ queryKey: ['products'] });

    if (isEdit) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.product(productId) });
    }
  };

  const onError = (error: unknown) => {
    toast.error(error instanceof ApiError ? error.message : '操作失败，请稍后重试');
  };

  const onSuccess = async (message: string) => {
    toast.success(message);
    await invalidateProducts();
    router.push('/products');
  };

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => onSuccess('商品已创建'),
    onError,
  });
  const updateMutation = useMutation({
    mutationFn: (input: ProductVersionInput) => updateProduct(productId, input),
    onSuccess: () => onSuccess('商品已保存'),
    onError,
  });
  const submitMutation = useMutation({
    mutationFn: () => submitProduct(productId),
    onSuccess: () => onSuccess('已提交审核'),
    onError,
  });
  const publishMutation = useMutation({
    mutationFn: () => publishProduct(productId),
    onSuccess: () => onSuccess('商品已发布'),
    onError,
  });
  const offlineMutation = useMutation({
    mutationFn: () => offlineProduct(productId),
    onSuccess: () => onSuccess('商品已下线'),
    onError,
  });

  const hasError = Object.keys(errors).length > 0;

  const handleSave = () => {
    if (readOnly || !canSave) {
      return;
    }

    const nextErrors = validateForm(state, {
      mode,
      shopId,
      code,
      requiredAttributeIds: categoryAttributes.filter(attribute => attribute.required).map(attribute => attribute.id),
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error('请检查表单填写');
      return;
    }

    if (mode === 'create') {
      createMutation.mutate(buildCreateInput(state, shopId, code));
    } else {
      updateMutation.mutate(buildVersionInput(state));
    }
  };

  const updateState = (patch: Partial<ProductFormState>) => {
    setState(previous => ({ ...previous, ...patch }));
  };

  const categoryOptions: SelectOption[] =
    categoriesQuery.data?.map(category => ({
      value: category.id,
      label: `${'　'.repeat(Math.max(category.level - 1, 0))}${category.name}`,
    })) ?? [];

  const brandOptions: SelectOption[] = [
    { value: '', label: '不选择品牌' },
    ...(brandsQuery.data?.map(brand => ({ value: brand.id, label: brand.name })) ?? []),
  ];

  const shopOptions: SelectOption[] = shops.map(shop => ({ value: shop.id, label: shop.name }));

  const loading =
    categoriesQuery.isPending || brandsQuery.isPending || (isEdit ? productQuery.isPending : merchantQuery.isPending);

  const loadFailed =
    categoriesQuery.isError || brandsQuery.isError || (isEdit ? productQuery.isError : merchantQuery.isError);

  if (loading) {
    return (
      <PageContainer title={isEdit ? '编辑商品' : '新建商品'}>
        <Skeleton rows={8} />
      </PageContainer>
    );
  }

  if (loadFailed) {
    return (
      <PageContainer title={isEdit ? '编辑商品' : '新建商品'}>
        <Empty description='商品信息加载失败' />
      </PageContainer>
    );
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <PageContainer
      title={isEdit ? '编辑商品' : '新建商品'}
      description={isEdit ? '编辑商品信息，或按当前状态提交审核、发布与下线。' : '填写商品信息并保存为草稿。'}
      actions={
        <div className={styles.actions}>
          {canSave ? (
            <Button type='submit' form='product-form' loading={saving}>
              保存
            </Button>
          ) : null}
          {showSubmit ? (
            <Button variant='secondary' loading={submitMutation.isPending} onClick={() => submitMutation.mutate()}>
              提交审核
            </Button>
          ) : null}
          {showPublish ? (
            <Button variant='secondary' loading={publishMutation.isPending} onClick={() => publishMutation.mutate()}>
              发布
            </Button>
          ) : null}
          {showOffline ? (
            <Button variant='danger' loading={offlineMutation.isPending} onClick={() => offlineMutation.mutate()}>
              下线
            </Button>
          ) : null}
          <Button variant='ghost' onClick={() => router.push('/products')}>
            返回列表
          </Button>
        </div>
      }
    >
      {submitted ? <p className={styles.notice}>审核中不可编辑</p> : null}
      {isEdit && !canUpdate && !submitted ? <p className={styles.notice}>当前账号无商品编辑权限，仅可查看。</p> : null}
      {isEdit && status ? (
        <p className={styles.meta}>
          商品编码：{product?.code ?? '--'}　当前状态：
          <Tag tone={STATUS_META[status].tone}>{STATUS_META[status].label}</Tag>
        </p>
      ) : null}

      <form
        id='product-form'
        className={styles.form}
        onSubmit={event => {
          event.preventDefault();
          handleSave();
        }}
      >
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>基本信息</h2>

          {mode === 'create' ? (
            <div className={styles.grid}>
              <Field label='店铺' required>
                <Select
                  aria-label='店铺'
                  placeholder='请选择店铺'
                  options={shopOptions}
                  value={shopId}
                  onChange={(value: SelectOptionValue) => setShopId(String(value))}
                  disabled={readOnly}
                  error={errors.shopId}
                />
              </Field>

              <Field label='商品编码' required>
                <Input
                  aria-label='商品编码'
                  value={code}
                  maxLength={50}
                  placeholder='例如 P1001'
                  onChange={event => setCode(event.target.value)}
                  disabled={readOnly}
                  error={errors.code}
                />
              </Field>
            </div>
          ) : null}

          <div className={styles.grid}>
            <Field label='类目' required>
              <Select
                aria-label='商品类目'
                placeholder='请选择类目'
                options={categoryOptions}
                value={state.categoryId}
                onChange={(value: SelectOptionValue) => updateState({ categoryId: String(value), attributes: {} })}
                disabled={readOnly}
                error={errors.categoryId}
              />
            </Field>

            <Field label='品牌'>
              <Select
                aria-label='商品品牌'
                options={brandOptions}
                value={state.brandId ?? ''}
                onChange={(value: SelectOptionValue) => updateState({ brandId: String(value) })}
                disabled={readOnly}
                error={errors.brandId}
              />
            </Field>
          </div>

          <Field label='商品标题' required>
            <Input
              aria-label='商品标题'
              value={state.title}
              maxLength={100}
              onChange={event => updateState({ title: event.target.value })}
              disabled={readOnly}
              error={errors.title}
            />
          </Field>

          <Field label='副标题'>
            <Input
              aria-label='副标题'
              value={state.subtitle}
              maxLength={100}
              onChange={event => updateState({ subtitle: event.target.value })}
              disabled={readOnly}
              error={errors.subtitle}
            />
          </Field>

          <Field label='商品描述' required>
            <Textarea
              aria-label='商品描述'
              value={state.description}
              rows={5}
              maxLength={5000}
              onChange={event => updateState({ description: event.target.value })}
              disabled={readOnly}
              error={errors.description}
            />
          </Field>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>商品图片</h2>
          <Field label='图片（最多 5 张，第一张为主图）' required error={errors.images}>
            <ProductImageField value={state.images} onChange={images => updateState({ images })} disabled={readOnly} />
          </Field>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>商品属性</h2>
          {selectedCategory ? (
            <AttributeFields
              attributes={categoryAttributes}
              values={state.attributes}
              onChange={attributes => updateState({ attributes })}
              disabled={readOnly}
              errors={errors}
            />
          ) : (
            <p className={styles.muted}>请先选择类目。</p>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>SKU</h2>
          <SkuEditor value={state.skus} onChange={skus => updateState({ skus })} disabled={readOnly} errors={errors} />
          {errors.skus ? (
            <p role='alert' className={styles.error}>
              {errors.skus}
            </p>
          ) : null}
        </section>

        {hasError ? (
          <p role='alert' className={styles.error}>
            请检查表单填写后再保存。
          </p>
        ) : null}
      </form>
    </PageContainer>
  );
}

export default ProductForm;
