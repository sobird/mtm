'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { z } from 'zod';

import { Button, Card, Empty, Field, Form, Select, Skeleton, useToast } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { translateApiError } from '@/lib/translate-api-error';

import StoreTypeGuideDialog from '../StoreTypeGuideDialog';
import StoreTypeSelector from '../StoreTypeSelector';
import type { EntryBase, EntryDetail, EntryTaskItem, EntryTypeItem, MerchantCategoryItem } from '../types';

import styles from './EntryShop.module.css';

const FORM_ID = 'entry-shop-form';

const shopSchema = z.object({
  category: z.union([z.number(), z.string()]).optional(),
  poiType: z.union([z.number(), z.string()]).optional(),
});

type ShopValues = z.infer<typeof shopSchema>;

function buildCategoryOptions(categories: MerchantCategoryItem[]) {
  const byId = new Map(categories.map(item => [item.id, item]));
  const parentIds = new Set(categories.map(item => item.parentId));

  return categories
    .filter(item => !parentIds.has(item.id))
    .map(item => {
      const names: string[] = [];
      let current: MerchantCategoryItem | undefined = item;
      let guard = 0;

      while (current && guard < 20) {
        names.unshift(current.name);
        current = byId.get(current.parentId);
        guard += 1;
      }

      return { value: item.id, label: names.join(' > ') };
    });
}

export function EntryShop() {
  const t = useTranslations('entry.shop');
  const tWarning = useTranslations('entry.warning');
  const tRoot = useTranslations();
  const router = useRouter();
  const toast = useToast();
  const [guideOpen, setGuideOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const taskQuery = useQuery({
    queryKey: ['entryTask'],
    queryFn: () => apiFetch<EntryTaskItem>('/api/merchant/entry/task'),
  });
  const entryQuery = useQuery({
    queryKey: ['entry'],
    queryFn: () =>
      apiFetch<EntryDetail>('/api/merchant/entry', {
        query: { entryTaskId: taskQuery.data.entryTaskId },
      }),
    enabled: Boolean(taskQuery.data),
  });
  const typesQuery = useQuery({
    queryKey: ['entryTypes'],
    queryFn: () => apiFetch<EntryTypeItem[]>('/api/merchant/entry/type'),
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.merchantCategories,
    queryFn: () => apiFetch<MerchantCategoryItem[]>('/api/merchant/category'),
  });

  const categoryOptions = useMemo(() => buildCategoryOptions(categoriesQuery.data ?? []), [categoriesQuery.data]);

  if (taskQuery.isError || entryQuery.isError || typesQuery.isError || categoriesQuery.isError) {
    return (
      <div className={styles.page}>
        <div className={styles.main}>
          <Empty description={t('loadFailed')} />
        </div>
      </div>
    );
  }

  if (taskQuery.isPending || entryQuery.isPending || typesQuery.isPending || categoriesQuery.isPending) {
    return (
      <div className={styles.page}>
        <div className={styles.main}>
          <Skeleton rows={6} />
        </div>
      </div>
    );
  }

  const base: Partial<EntryBase> = entryQuery.data?.base ?? {};
  const types = typesQuery.data ?? [];

  const handleSubmit = async (values: ShopValues) => {
    if (values.category === undefined || values.category === null || values.category === '') {
      toast.error(t('categoryRequired'));
      return;
    }

    if (values.poiType === undefined || values.poiType === null || values.poiType === '') {
      toast.error(t('typeRequired'));
      return;
    }

    setSubmitting(true);

    try {
      await apiFetch<EntryDetail>('/api/merchant/entry', {
        method: 'PATCH',
        body: {
          entryTaskId: taskQuery.data?.entryTaskId,
          base: {
            ...base,
            category: Number(values.category),
            poiType: Number(values.poiType),
          },
        },
      });
      router.push('/settleinjx/company');
    } catch (error) {
      toast.error(translateApiError(error, tRoot, 'entry.shop.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.tips}>
        <div className={styles.alert} role='alert'>
          {tWarning('description')}
        </div>
      </div>

      <div className={styles.main}>
        <h2 className={styles.heading}>{t('heading')}</h2>

        <Card>
          <Form
            id={FORM_ID}
            schema={shopSchema}
            defaultValues={{
              category: base.category,
              poiType: base.poiType === undefined || base.poiType === null ? undefined : String(base.poiType),
            }}
            onSubmit={handleSubmit}
            className={styles.form}
          >
            <Field className={styles.bigField} label={t('category')}>
              <Select name='category' options={categoryOptions} placeholder={t('categoryPlaceholder')} />
            </Field>

            <Field
              className={styles.bigField}
              label={
                <span>
                  {t('type')}
                  <button type='button' className={styles.how} onClick={() => setGuideOpen(true)}>
                    {t('howToChoose')}
                  </button>
                </span>
              }
            >
              <StoreTypeSelector types={types} />
            </Field>
          </Form>
        </Card>
      </div>

      <div className={styles.footer}>
        <Button type='submit' form={FORM_ID} loading={submitting}>
          {t('next')}
        </Button>
      </div>

      <StoreTypeGuideDialog open={guideOpen} onOpenChange={setGuideOpen} />
    </div>
  );
}

export default EntryShop;
