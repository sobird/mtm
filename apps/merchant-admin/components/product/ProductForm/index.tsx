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
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { Controller, useFormContext, useFormState, useWatch } from 'react-hook-form';

import { PageContainer } from '@/components/layout/PageContainer';
import { Button, Empty, Field, Form, Input, Select, Skeleton, Tag, Textarea, useToast } from '@/components/ui';
import type { SelectOption, TagTone } from '@/components/ui';
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
import { translateApiError } from '@/lib/translate-api-error';

import AttributeFields from '../AttributeFields';
import ProductImageField from '../ProductImageField';
import { createEmptySku, SkuEditor } from '../SkuEditor';
import { buildCreateInput, buildVersionInput } from './payload';
import type { ProductFormState } from './payload';
import { createProductFormSchema, MAX_IMAGES } from './schema';
import type { ProductFormMode, ProductFormValues } from './schema';

import styles from './index.module.css';

export type ProductFormProps = { mode: 'create' } | { mode: 'edit'; productId: string };

const STATUS_TONES: Record<ProductVersionStatus, TagTone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  PUBLISHED: 'success',
  SUPERSEDED: 'neutral',
  OFFLINE: 'danger',
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
  const t = useTranslations('product');
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
    { value: '', label: t('form.noBrand') },
    ...brands.map(brand => ({ value: brand.id, label: brand.name })),
  ];

  const shopOptions: SelectOption[] = shops.map(shop => ({ value: shop.id, label: shop.name }));

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('form.basicInfo')}</h2>

        {mode === 'create' ? (
          <div className={styles.grid}>
            <Field label={t('form.shop')} required>
              <Select
                name='shopId'
                aria-label={t('form.shop')}
                placeholder={t('form.shopPlaceholder')}
                options={shopOptions}
                disabled={readOnly}
              />
            </Field>

            <Field label={t('form.code')} required>
              <Input
                name='code'
                aria-label={t('form.code')}
                data-testid='product-code'
                maxLength={50}
                placeholder={t('form.codePlaceholder')}
                disabled={readOnly}
              />
            </Field>
          </div>
        ) : null}

        <div className={styles.grid}>
          <Field label={t('form.category')} required>
            <Select
              name='categoryId'
              aria-label={t('form.category')}
              data-testid='product-category'
              placeholder={t('form.categoryPlaceholder')}
              options={categoryOptions}
              disabled={readOnly}
            />
          </Field>

          <Field label={t('form.brand')}>
            <Select
              name='brandId'
              aria-label={t('form.brand')}
              data-testid='product-brand'
              options={brandOptions}
              disabled={readOnly}
            />
          </Field>
        </div>

        <Field label={t('form.title')} required>
          <Input
            name='title'
            aria-label={t('form.title')}
            data-testid='product-title'
            maxLength={100}
            disabled={readOnly}
          />
        </Field>

        <Field label={t('form.subtitle')}>
          <Input name='subtitle' aria-label={t('form.subtitle')} maxLength={100} disabled={readOnly} />
        </Field>

        <Field label={t('form.description')} required>
          <Textarea
            name='description'
            aria-label={t('form.description')}
            rows={5}
            maxLength={5000}
            disabled={readOnly}
          />
        </Field>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('form.imagesSection')}</h2>
        <Controller
          control={control}
          name='images'
          render={({ field, fieldState }) => (
            <Field
              label={t('form.imagesLabel', { max: MAX_IMAGES })}
              required
              error={fieldState.error?.message as string | undefined}
            >
              <ProductImageField value={field.value ?? []} onChange={field.onChange} disabled={readOnly} />
            </Field>
          )}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('form.attributesSection')}</h2>
        {categoryId ? (
          <AttributeFields attributes={categoryAttributes} disabled={readOnly} />
        ) : (
          <p className={styles.muted}>{t('form.chooseCategoryFirst')}</p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('form.skuSection')}</h2>
        <SkuEditor disabled={readOnly} />
        {errors.skus?.message ? (
          <p role='alert' className={styles.error}>
            {errors.skus.message as string}
          </p>
        ) : null}
      </section>

      {isSubmitted && Object.keys(errors).length > 0 ? (
        <p role='alert' className={styles.error}>
          {t('form.formInvalid')}
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
  const t = useTranslations('product');
  const tCommon = useTranslations('common');
  const tRoot = useTranslations();
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
  const schema = useMemo(() => createProductFormSchema(mode, () => attributesRef.current, tRoot), [mode, tRoot]);

  const invalidateProducts = async () => {
    await queryClient.invalidateQueries({ queryKey: ['products'] });

    if (isEdit) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.product(productId) });
    }
  };

  const onError = (error: unknown) => {
    toast.error(translateApiError(error, tRoot, 'product.toast.actionFailed'));
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
      return onSuccess(t('toast.created'));
    },
    onError,
  });
  const updateMutation = useMutation({
    mutationFn: (input: ProductVersionInput) => updateProduct(productId, input),
    onSuccess: () => {
      resetDirtyState();
      return onSuccess(t('toast.saved'));
    },
    onError,
  });
  const submitMutation = useMutation({
    mutationFn: () => submitProduct(productId),
    onSuccess: () => onSuccess(t('toast.submitted')),
    onError,
  });
  const publishMutation = useMutation({
    mutationFn: () => publishProduct(productId),
    onSuccess: () => onSuccess(t('toast.published')),
    onError,
  });
  const offlineMutation = useMutation({
    mutationFn: () => offlineProduct(productId),
    onSuccess: () => onSuccess(t('toast.offline')),
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
      <PageContainer title={isEdit ? t('form.editTitle') : t('form.createTitle')}>
        <Skeleton rows={8} />
      </PageContainer>
    );
  }

  if (loadFailed) {
    return (
      <PageContainer title={isEdit ? t('form.editTitle') : t('form.createTitle')}>
        <Empty description={t('form.loadFailed')} />
      </PageContainer>
    );
  }

  const defaultValues = isEdit && product ? toFormValues(product) : emptyValues(shops[0]?.id ?? '');
  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <PageContainer
      title={isEdit ? t('form.editTitle') : t('form.createTitle')}
      description={isEdit ? t('form.editDescription') : t('form.createDescription')}
      actions={
        <div className={styles.actions}>
          {canSave ? (
            <Button type='submit' form='product-form' loading={saving}>
              {tCommon('save')}
            </Button>
          ) : null}
          {showSubmit ? (
            <Button
              variant='secondary'
              data-testid='product-submit'
              loading={submitMutation.isPending}
              disabled={dirty}
              onClick={() => submitMutation.mutate()}
            >
              {t('actions.submit')}
            </Button>
          ) : null}
          {showPublish ? (
            <Button
              variant='secondary'
              data-testid='product-publish'
              loading={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
            >
              {t('actions.publish')}
            </Button>
          ) : null}
          {showOffline ? (
            <Button
              variant='danger'
              data-testid='product-offline'
              loading={offlineMutation.isPending}
              onClick={() => offlineMutation.mutate()}
            >
              {t('actions.offline')}
            </Button>
          ) : null}
          <Button variant='ghost' onClick={() => router.push('/products')}>
            {t('form.backToList')}
          </Button>
        </div>
      }
    >
      {status === 'REJECTED' && product?.latestAudit?.comment ? (
        <p role='alert' className={styles.reject}>
          {t('form.rejectReason', { comment: product.latestAudit.comment })}
        </p>
      ) : null}
      {showSubmit && dirty ? <p className={styles.notice}>{t('form.saveBeforeSubmit')}</p> : null}
      {submitted ? <p className={styles.notice}>{t('form.underReview')}</p> : null}
      {isEdit && !canUpdate && !submitted ? <p className={styles.notice}>{t('form.readOnlyNotice')}</p> : null}
      {isEdit && status ? (
        <p className={styles.meta}>
          {t('form.metaCode', { code: product?.code ?? '--' })} {t('form.metaStatus')}{' '}
          <span data-testid='product-status'>
            <Tag tone={STATUS_TONES[status]}>{t('status.' + status)}</Tag>
          </span>
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
