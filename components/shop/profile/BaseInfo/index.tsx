'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormState } from 'react-hook-form';

import FieldMerchantLogo from '@/components/admin/FieldMerchantLogo';
import { Button, Card, Empty, Field, Form, Input, LabelValue, Skeleton, Textarea, useToast } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { MerchantCategoryDTO } from '@/lib/services/merchant';
import { baseInfoSchema } from '@/lib/validation/profile';

import AdminForm from '../../admin/AdminForm';
import ContactForm from '../ContactForm';
import { display } from '../display';
import type { MerchantProfileDTO } from '../types';

import styles from './BaseInfo.module.css';

const SHOP_TYPE_LABELS: Record<number, string> = {
  10: '个人普通店铺',
  20: '企业普通店铺',
  21: '企业专营店铺',
  22: '企业专卖店铺',
  23: '企业旗舰店铺',
  99: '其他',
};

function categoryPath(categoryId: number | undefined, categories: MerchantCategoryDTO[]): string {
  if (categoryId === undefined || categoryId === null) {
    return '--';
  }

  const byId = new Map(categories.map(item => [item.id, item]));
  const names: string[] = [];
  let current = byId.get(categoryId);
  let guard = 0;

  while (current && guard < 20) {
    names.unshift(current.name);
    current = byId.get(current.parentId);
    guard += 1;
  }

  return names.length > 0 ? names.join(' > ') : '--';
}

function BaseInfoSubmitButton() {
  const { isSubmitting } = useFormState();

  return (
    <div className={styles.actions}>
      <Button type='submit' loading={isSubmitting}>
        更新店铺基本信息
      </Button>
    </div>
  );
}

export function BaseInfo() {
  const toast = useToast();
  const merchantQuery = useQuery({
    queryKey: queryKeys.merchant,
    queryFn: () => apiFetch<MerchantProfileDTO>('/api/merchant/detail'),
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.merchantCategories,
    queryFn: () => apiFetch<MerchantCategoryDTO[]>('/api/merchant/category'),
  });

  if (merchantQuery.isPending || categoriesQuery.isPending) {
    return <Skeleton rows={6} />;
  }

  if (merchantQuery.isError || categoriesQuery.isError) {
    return <Empty description='加载失败' />;
  }

  const merchant = merchantQuery.data;
  const shop = merchant?.shopInfo;
  const categories = categoriesQuery.data ?? [];

  const handleCopy = async () => {
    if (shop?.id === undefined || shop?.id === null) {
      return;
    }

    try {
      await navigator.clipboard.writeText(String(shop.id));
      toast.success('店铺编号已复制');
    } catch {
      toast.error('复制失败，请手动复制');
    }
  };

  return (
    <div className={styles.panel}>
      <Card title='基础信息'>
        <div className={styles.displayList}>
          <LabelValue label='店铺编号'>
            <span className={styles.copyRow}>
              {display(shop?.id)}
              <Button
                variant='ghost'
                size='sm'
                aria-label='复制店铺编号'
                onClick={handleCopy}
                disabled={shop?.id === undefined || shop?.id === null}
              >
                复制
              </Button>
            </span>
          </LabelValue>
          <LabelValue label='店铺名称'>{display(shop?.name)}</LabelValue>
          <LabelValue label='店铺类型'>
            {shop?.type === undefined ? '--' : (SHOP_TYPE_LABELS[shop.type] ?? '--')}
          </LabelValue>
          <LabelValue label='主营类目'>{categoryPath(shop?.category, categories)}</LabelValue>
          <LabelValue label='店铺标志'>
            <FieldMerchantLogo status={6} defaultValue={shop?.logo ? [shop.logo] : []} />
          </LabelValue>
        </div>

        <Form
          schema={baseInfoSchema}
          defaultValues={{ description: shop?.description ?? '', externalLink: shop?.externalLink ?? '' }}
          onSubmit={() => {
            toast.success('店铺基本信息已更新');
          }}
          className={styles.form}
        >
          <Field label='店铺简介' hint='最多200个字符'>
            <Textarea
              name='description'
              placeholder='填写店铺简介，可让消费者更了解您的店铺'
              maxLength={200}
              rows={5}
              aria-label='店铺简介'
            />
          </Field>

          <Field label='第三方平台店铺链接'>
            <Input
              name='externalLink'
              placeholder='填写真实的其他平台店铺链接'
              maxLength={1000}
              aria-label='第三方平台店铺链接'
            />
          </Field>

          <BaseInfoSubmitButton />
        </Form>
      </Card>

      <Card title='管理员信息'>
        <AdminForm />
      </Card>

      <Card title='联系方式'>
        <ContactForm defaultEmail={merchant?.merchantManagerInfo?.email} defaultServicePhone={shop?.servicePhoneNum} />
      </Card>
    </div>
  );
}

export default BaseInfo;
