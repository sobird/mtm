'use client';

import type {
  BrandDTO,
  CategoryNodeDTO,
  ProductDetailDTO,
  ProductVersionInput,
  ProductVersionStatus,
} from '@mtm/contracts';
import { PERMISSIONS } from '@mtm/contracts';
import { usePermissions } from '@mtm/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { Controller, useFormContext, useFormState, useWatch } from 'react-hook-form';

import { PageContainer } from '@/components/layout/PageContainer';
import { Button, Empty, Field, Form, Input, Select, Skeleton, Tag, Textarea, useToast } from '@/components/ui';
import type { SelectOption, TagTone } from '@/components/ui';
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
import { createProductFormSchema, MAX_IMAGES } from './schema';
import type { ProductFormMode, ProductFormValues } from './schema';

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

function emptyValues(shopId: string): ProductFormValues {
  return {
    shopId,
    code: '',
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

/** 商品详情回填为表单值；规格取第一个值。 */
function toFormValues(product: ProductDetailDTO): ProductFormValues {
  const version = product.currentVersion;

  return {
    shopId: product.shopId,
    code: product.code,
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

function toFormState(values: ProductFormValues): ProductFormState {
  return {
    categoryId: values.categoryId,
    brandId: values.brandId,
    title: values.title,
    subtitle: values.subtitle,
    images: values.images,
    description: values.description,
    attributes: values.attributes,
    skus: values.skus,
  };
}

type FormReset = (values: ProductFormValues) => void;

interface ProductFormBridgeProps {
  onDirtyChange: (dirty: boolean) => void;
  resetRef: MutableRefObject<FormReset | null>;
}

/**
 * 按钮渲染在 `FormProvider` 之外，用桥接组件把表单的 `isDirty` 与 `reset`
 * 暴露给页面级操作栏：有未保存修改时禁止提交审核，保存成功后清除脏状态。
 */
function ProductFormBridge({ onDirtyChange, resetRef }: ProductFormBridgeProps) {
  const { reset } = useFormContext<ProductFormValues>();
  const { isDirty } = useFormState<ProductFormValues>();

  useEffect(() => {
    resetRef.current = values => reset(values);
  }, [reset, resetRef]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  return null;
}

interface ProductFormFieldsProps {
  mode: ProductFormMode;
  readOnly: boolean;
  categories: CategoryNodeDTO[];
  brands: BrandDTO[];
  shops: Array<{ id: string; name: string }>;
  attributesRef: MutableRefObject<CategoryNodeDTO['attributes']>;
}

function ProductFormFields({ mode, readOnly, categories, brands, shops, attributesRef }: ProductFormFieldsProps) {
  const { control, setValue } = useFormContext<ProductFormValues>();
  const { errors, isSubmitted } = useFormState<ProductFormValues>();
  const categoryId = useWatch({ control, name: 'categoryId' }) as string | undefined;
  const categoryAttributes = useMemo(
    () => categories.find(category => category.id === categoryId)?.attributes ?? [],
    [categories, categoryId]
  );
  const initialCategory = useRef(categoryId);

  useEffect(() => {
    attributesRef.current = categoryAttributes;
  }, [attributesRef, categoryAttributes]);

  useEffect(() => {
    if (categoryId === initialCategory.current) {
      return;
    }

    initialCategory.current = categoryId;
    setValue('attributes', {}, { shouldDirty: true });
  }, [categoryId, setValue]);

  const categoryOptions: SelectOption[] =
    categories.map(category => ({
      value: category.id,
      label: `${'　'.repeat(Math.max(category.level - 1, 0))}${category.name}`,
    })) ?? [];

  const brandOptions: SelectOption[] = [
    { value: '', label: '不选择品牌' },
    ...brands.map(brand => ({ value: brand.id, label: brand.name })),
  ];

  const shopOptions: SelectOption[] = shops.map(shop => ({ value: shop.id, label: shop.name }));

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>基本信息</h2>

        {mode === 'create' ? (
          <div className={styles.grid}>
            <Field label='店铺' required>
              <Select
                name='shopId'
                aria-label='店铺'
                placeholder='请选择店铺'
                options={shopOptions}
                disabled={readOnly}
              />
            </Field>

            <Field label='商品编码' required>
              <Input name='code' aria-label='商品编码' maxLength={50} placeholder='例如 P1001' disabled={readOnly} />
            </Field>
          </div>
        ) : null}

        <div className={styles.grid}>
          <Field label='类目' required>
            <Select
              name='categoryId'
              aria-label='商品类目'
              placeholder='请选择类目'
              options={categoryOptions}
              disabled={readOnly}
            />
          </Field>

          <Field label='品牌'>
            <Select name='brandId' aria-label='商品品牌' options={brandOptions} disabled={readOnly} />
          </Field>
        </div>

        <Field label='商品标题' required>
          <Input name='title' aria-label='商品标题' maxLength={100} disabled={readOnly} />
        </Field>

        <Field label='副标题'>
          <Input name='subtitle' aria-label='副标题' maxLength={100} disabled={readOnly} />
        </Field>

        <Field label='商品描述' required>
          <Textarea name='description' aria-label='商品描述' rows={5} maxLength={5000} disabled={readOnly} />
        </Field>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>商品图片</h2>
        <Controller
          control={control}
          name='images'
          render={({ field, fieldState }) => (
            <Field
              label={`图片（最多 ${MAX_IMAGES} 张，第一张为主图）`}
              required
              error={fieldState.error?.message as string | undefined}
            >
              <ProductImageField value={field.value ?? []} onChange={field.onChange} disabled={readOnly} />
            </Field>
          )}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>商品属性</h2>
        {categoryId ? (
          <AttributeFields attributes={categoryAttributes} disabled={readOnly} />
        ) : (
          <p className={styles.muted}>请先选择类目。</p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>SKU</h2>
        <SkuEditor disabled={readOnly} />
        {errors.skus?.message ? (
          <p role='alert' className={styles.error}>
            {errors.skus.message as string}
          </p>
        ) : null}
      </section>

      {isSubmitted && Object.keys(errors).length > 0 ? (
        <p role='alert' className={styles.error}>
          请检查表单填写后再保存。
        </p>
      ) : null}
    </>
  );
}

export function ProductForm(props: ProductFormProps) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const mode: ProductFormMode = props.mode;
  const productId = props.mode === 'edit' ? props.productId : '';
  const isEdit = props.mode === 'edit';
  const attributesRef = useRef<CategoryNodeDTO['attributes']>([]);
  const [dirty, setDirty] = useState(false);
  const formResetRef = useRef<FormReset | null>(null);
  const submittedValuesRef = useRef<ProductFormValues | null>(null);

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

  // 校验时才读取最新类目属性；重建表单会丢失输入，因此 schema 在挂载时创建一次。
  // eslint-disable-next-line react/refs -- 仅在表单校验时读取 ref，不参与渲染
  const schema = useMemo(() => createProductFormSchema(mode, () => attributesRef.current), [mode]);

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

  const resetDirtyState = () => {
    if (submittedValuesRef.current) {
      formResetRef.current?.(submittedValuesRef.current);
    }
  };

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      resetDirtyState();
      return onSuccess('商品已创建');
    },
    onError,
  });
  const updateMutation = useMutation({
    mutationFn: (input: ProductVersionInput) => updateProduct(productId, input),
    onSuccess: () => {
      resetDirtyState();
      return onSuccess('商品已保存');
    },
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

  const handleSave = (values: ProductFormValues) => {
    if (readOnly || !canSave) {
      return;
    }

    const state = toFormState(values);
    submittedValuesRef.current = values;

    if (mode === 'create') {
      createMutation.mutate(buildCreateInput(state, values.shopId, values.code));
    } else {
      updateMutation.mutate(buildVersionInput(state));
    }
  };

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

  const defaultValues = isEdit && product ? toFormValues(product) : emptyValues(shops[0]?.id ?? '');
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
            <Button
              variant='secondary'
              loading={submitMutation.isPending}
              disabled={dirty}
              onClick={() => submitMutation.mutate()}
            >
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
      {status === 'REJECTED' && product?.latestAudit?.comment ? (
        <p role='alert' className={styles.reject}>
          驳回原因：{product.latestAudit.comment}
        </p>
      ) : null}
      {showSubmit && dirty ? <p className={styles.notice}>请先保存修改，再提交审核。</p> : null}
      {submitted ? <p className={styles.notice}>审核中不可编辑</p> : null}
      {isEdit && !canUpdate && !submitted ? <p className={styles.notice}>当前账号无商品编辑权限，仅可查看。</p> : null}
      {isEdit && status ? (
        <p className={styles.meta}>
          商品编码：{product?.code ?? '--'}　当前状态：
          <Tag tone={STATUS_META[status].tone}>{STATUS_META[status].label}</Tag>
        </p>
      ) : null}

      <Form
        id='product-form'
        schema={schema}
        defaultValues={defaultValues}
        onSubmit={handleSave}
        className={styles.form}
      >
        <ProductFormBridge onDirtyChange={setDirty} resetRef={formResetRef} />
        <ProductFormFields
          mode={mode}
          readOnly={readOnly}
          categories={categoriesQuery.data ?? []}
          brands={brandsQuery.data ?? []}
          shops={shops}
          attributesRef={attributesRef}
        />
      </Form>
    </PageContainer>
  );
}

export default ProductForm;
