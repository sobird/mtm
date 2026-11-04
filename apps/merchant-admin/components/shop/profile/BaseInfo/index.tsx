'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useFormState } from 'react-hook-form';

import FieldMerchantLogo from '@/components/admin/FieldMerchantLogo';
import { Button, Card, Empty, Field, Form, Input, LabelValue, Skeleton, Textarea, useToast } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { MerchantCategoryDTO } from '@/lib/services/merchant';
import { fetchMyMerchant, updateMyShop } from '@/lib/services/shop-profile';
import { translateApiError } from '@/lib/translate-api-error';
import { createBaseInfoSchema, type BaseInfoValues } from '@/lib/validation/profile';

import AdminForm from '../../admin/AdminForm';
import ContactForm from '../ContactForm';
import { display } from '../display';
import type { MerchantProfileDTO } from '../types';

import styles from './BaseInfo.module.css';

const SHOP_TYPE_KEYS: Record<number, string> = {
  10: 'shopType.10',
  20: 'shopType.20',
  21: 'shopType.21',
  22: 'shopType.22',
  23: 'shopType.23',
  99: 'shopType.99',
};

function categoryPath(categoryId: number | undefined, categories: MerchantCategoryDTO[]): string {
  if (categoryId === undefined || categoryId === null) {
    return '--';
  }

  const byId = new Map(categories.map(item => [item.id, item]));
  const names: string[] = [];
  let current = byId.get(String(categoryId));
  let guard = 0;

  while (current && guard < 20) {
    names.unshift(current.name);
    current = byId.get(current.parentId);
    guard += 1;
  }

  return names.length > 0 ? names.join(' > ') : '--';
}

function BaseInfoSubmitButton({ label }: { label: string }) {
  const { isSubmitting } = useFormState();

  return (
    <div className={styles.actions}>
      <Button type='submit' loading={isSubmitting}>
        {label}
      </Button>
    </div>
  );
}

export function BaseInfo() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('shop');
  const tCommon = useTranslations('common');
  const tRoot = useTranslations();
  const baseInfoSchema = createBaseInfoSchema(tRoot);

  const merchantQuery = useQuery({
    queryKey: queryKeys.merchant,
    queryFn: () => apiFetch<MerchantProfileDTO>('/api/merchant/detail'),
  });
  const myMerchantQuery = useQuery({
    queryKey: queryKeys.myMerchant,
    queryFn: fetchMyMerchant,
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.merchantCategories,
    queryFn: () => apiFetch<MerchantCategoryDTO[]>('/api/merchant/category'),
  });

  const coreShop = myMerchantQuery.data?.shops[0];
  const shopId = coreShop?.id;
  const coreShopReady = myMerchantQuery.isSuccess && coreShop !== undefined;

  if (merchantQuery.isPending || categoriesQuery.isPending) {
    return <Skeleton rows={6} />;
  }

  if (merchantQuery.isError || categoriesQuery.isError) {
    return <Empty description={tCommon('loadFailed')} />;
  }

  const merchant = merchantQuery.data;
  const shop = merchant?.shopInfo;
  const categories = categoriesQuery.data ?? [];

  const handleSubmit = async (values: BaseInfoValues) => {
    if (!shopId) {
      toast.error(t('notReady'));
      return;
    }

    try {
      await updateMyShop(shopId, values);
      toast.success(t('toast.saved'));
      await queryClient.invalidateQueries({ queryKey: queryKeys.myMerchant });
    } catch (error) {
      toast.error(translateApiError(error, tRoot, 'common.actionFailed'));
    }
  };

  const handleCopy = async () => {
    if (shop?.id === undefined || shop?.id === null) {
      return;
    }

    try {
      await navigator.clipboard.writeText(String(shop.id));
      toast.success(t('toast.copied'));
    } catch {
      toast.error(t('toast.copyFailed'));
    }
  };

  return (
    <div className={styles.panel}>
      <Card title={t('baseInfo.title')}>
        <div className={styles.displayList}>
          <LabelValue label={t('baseInfo.id')}>
            <span className={styles.copyRow}>
              {display(shop?.id)}
              <Button
                variant='ghost'
                size='sm'
                aria-label={t('baseInfo.copyId')}
                onClick={handleCopy}
                disabled={shop?.id === undefined || shop?.id === null}
              >
                {tCommon('copy')}
              </Button>
            </span>
          </LabelValue>
          <LabelValue label={t('baseInfo.name')}>{display(shop?.name)}</LabelValue>
          <LabelValue label={t('baseInfo.type')}>
            {shop?.type === undefined ? '--' : t(SHOP_TYPE_KEYS[shop.type] ?? 'shopType.99')}
          </LabelValue>
          <LabelValue label={t('baseInfo.category')}>{categoryPath(shop?.category, categories)}</LabelValue>
          <LabelValue label={t('baseInfo.logo')}>
            <FieldMerchantLogo status={6} defaultValue={shop?.logo ? [shop.logo] : []} />
          </LabelValue>
        </div>

        {coreShopReady ? (
          <Form
            schema={baseInfoSchema}
            defaultValues={{ description: coreShop?.description ?? '', externalLink: coreShop?.externalLink ?? '' }}
            onSubmit={handleSubmit}
            className={styles.form}
          >
            <Field label={t('baseInfo.description')} hint={t('baseInfo.descriptionHint')}>
              <Textarea
                name='description'
                placeholder={t('baseInfo.descriptionPlaceholder')}
                maxLength={200}
                rows={5}
                aria-label={t('baseInfo.description')}
              />
            </Field>

            <Field label={t('baseInfo.externalLink')}>
              <Input
                name='externalLink'
                placeholder={t('baseInfo.externalLinkPlaceholder')}
                maxLength={1000}
                aria-label={t('baseInfo.externalLink')}
              />
            </Field>

            <BaseInfoSubmitButton label={tCommon('save')} />
          </Form>
        ) : myMerchantQuery.isError ? (
          <div className={styles.actions}>
            <Empty description={t('loadFailed')} />
            <Button
              variant='ghost'
              onClick={() => {
                void myMerchantQuery.refetch();
              }}
            >
              {tCommon('retry')}
            </Button>
          </div>
        ) : (
          <Skeleton rows={4} />
        )}
      </Card>

      <Card title={t('baseInfo.adminCard')}>
        <AdminForm />
      </Card>

      <Card title={t('baseInfo.contactCard')}>
        <ContactForm defaultEmail={merchant?.merchantManagerInfo?.email} defaultServicePhone={shop?.servicePhoneNum} />
      </Card>
    </div>
  );
}

export default BaseInfo;
