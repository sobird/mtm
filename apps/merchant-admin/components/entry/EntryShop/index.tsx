'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { z } from 'zod';

import { Button, Card, Empty, Field, Form, Select, Skeleton, useToast } from '@/components/ui';
import { ApiError, apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

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
          <Empty description='加载失败' />
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
      toast.error('请选择主营类目');
      return;
    }

    if (values.poiType === undefined || values.poiType === null || values.poiType === '') {
      toast.error('请选择店铺类型');
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
      toast.error(error instanceof ApiError ? error.message : '保存失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.tips}>
        <div className={styles.alert} role='alert'>
          目前平台仅开放数码家电/办公、宠物生活、母婴玩具、服饰鞋包、运动户外、汽配摩托、医药健康类目的商家自入驻，其余类目邀约制入驻请勿提交申请。入驻审核时效预计在7个工作日内，感谢支持。
        </div>
      </div>

      <div className={styles.main}>
        <h2 className={styles.heading}>请选择您的店铺类型及主营类目</h2>

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
            <Field className={styles.bigField} label='主营类目'>
              <Select
                name='category'
                options={categoryOptions}
                placeholder='主营类目决定您店铺的经营范围，请谨慎选择'
              />
            </Field>

            <Field
              className={styles.bigField}
              label={
                <span>
                  店铺类型
                  <button type='button' className={styles.how} onClick={() => setGuideOpen(true)}>
                    该如何选择？
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
          下一步
        </Button>
      </div>

      <StoreTypeGuideDialog open={guideOpen} onOpenChange={setGuideOpen} />
    </div>
  );
}

export default EntryShop;
