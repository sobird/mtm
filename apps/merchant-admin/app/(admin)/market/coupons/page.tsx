'use client';

import type { Translate } from '@mtm/i18n';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';

import { PageContainer } from '@/components/layout/PageContainer';
import CreateCouponEntry from '@/components/market/coupon/CreateCouponEntry';
import { Button, DataTable, DateRangePicker, Dialog, Empty, Select, Tag, useToast } from '@/components/ui';
import type { DataTableChange, DataTableColumns, SelectOptionValue, TagTone } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { CouponListItemDTO } from '@/lib/services/coupon';
import { translateApiError } from '@/lib/translate-api-error';

import styles from './page.module.css';

const PAGE_SIZE = 10;

interface CouponListResponse {
  total: number;
  pn: number;
  ps: number;
  list: CouponListItemDTO[];
}

const STATUS_VALUES = [-1, 0, 1, 2, 6] as const;
const STATUS_LABEL_KEYS: Record<number, string> = {
  [-1]: 'all',
  0: 'notStarted',
  1: 'ongoing',
  2: 'ended',
  6: 'offline',
};

const STATUS_META: Record<number, { labelKey: string; tone: TagTone }> = {
  0: { labelKey: 'notStarted', tone: 'neutral' },
  1: { labelKey: 'ongoing', tone: 'success' },
  2: { labelKey: 'ended', tone: 'info' },
  6: { labelKey: 'offline', tone: 'danger' },
};

const TYPE_KEYS: Record<number, string> = {
  0: 'fullReduction',
  1: 'discount',
};

const TARGET_KEYS: Record<number, string> = {
  1: 'target.product',
  2: 'target.universal',
  3: 'target.service',
};

const SORTABLE_COLUMNS = new Set(['ctime', 'sendCount', 'leftCount']);

type SortKey = 'ctime' | 'sendCount' | 'leftCount';
type SortDirection = 'asc' | 'desc';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatISO(iso: string | null | undefined): string {
  if (!iso) {
    return '--';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:${pad(date.getSeconds())}`;
}

function formatEpochDate(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '--';
  }

  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatUseTerm(value: unknown, t: Translate): string {
  if (!Array.isArray(value)) {
    return '--';
  }

  const [days, range] = value;

  if (Array.isArray(range) && range.length >= 2) {
    return t('coupon.useTermRange', { start: formatEpochDate(range[0]), end: formatEpochDate(range[1]) });
  }

  return t('coupon.useTermDays', { days: typeof days === 'number' ? days : '-' });
}

function toEpoch(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? Math.floor(time / 1000) : undefined;
}

export default function MarketCouponsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('marketing');
  const tCommon = useTranslations('common');
  const tRoot = useTranslations();

  const [status, setStatus] = useState<SelectOptionValue>(-1);
  const [stime, setStime] = useState('');
  const [etime, setEtime] = useState('');
  const [target, setTarget] = useState<number | undefined>();
  // Mirrors the service default so the initial sort indicator matches the data.
  const [sort, setSort] = useState<SortKey | undefined>('ctime');
  const [order, setOrder] = useState<SortDirection | undefined>('desc');
  const [page, setPage] = useState(1);

  const [offlineTarget, setOfflineTarget] = useState<CouponListItemDTO | null>(null);
  const [offlinePending, setOfflinePending] = useState(false);

  const statusOptions = STATUS_VALUES.map(value => ({
    value,
    label: t(`coupon.status.${STATUS_LABEL_KEYS[value]}`),
  }));

  const targetFilters = [1, 2, 3].map(value => ({ text: t(TARGET_KEYS[value]), value }));

  const params = {
    pn: page,
    ps: PAGE_SIZE,
    status: status === -1 ? undefined : Number(status),
    stime: toEpoch(stime),
    etime: toEpoch(etime),
    target,
    sort,
    order,
  };

  const couponsQuery = useQuery({
    queryKey: queryKeys.coupons(params),
    queryFn: () => apiFetch<CouponListResponse>('/api/merchant/coupon', { query: params }),
  });

  const resetPage = () => setPage(1);

  const handleOffline = async () => {
    if (!offlineTarget) {
      return;
    }

    setOfflinePending(true);

    try {
      await apiFetch(`/api/merchant/coupon/${offlineTarget.id}`, { method: 'DELETE' });
      toast.success(t('coupon.offlineSuccess'));
      await queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setOfflineTarget(null);
    } catch (error) {
      toast.error(translateApiError(error, tRoot, 'marketing.coupon.offlineFailed'));
    } finally {
      setOfflinePending(false);
    }
  };

  const sortOrderFor = (key: SortKey) => (sort === key ? (order === 'asc' ? 'ascend' : 'descend') : null);

  const handleTableChange = ({ sorter, filters }: DataTableChange) => {
    const key = sorter?.columnKey;

    if (key && SORTABLE_COLUMNS.has(key) && sorter?.order) {
      setSort(key as SortKey);
      setOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    } else {
      setSort(undefined);
      setOrder(undefined);
    }

    const nextTarget = filters?.target?.[0];
    setTarget(nextTarget === undefined || nextTarget === null ? undefined : Number(nextTarget));
    setPage(1);
  };

  const columns: DataTableColumns<CouponListItemDTO> = [
    {
      dataIndex: 'id',
      title: t('coupon.column.code'),
      render: (_, row) => row.id,
    },
    {
      dataIndex: 'name',
      title: t('coupon.column.name'),
      render: (_, row) => (
        <Link className={styles.link} href={`/market/coupon/${row.id}`}>
          {row.name}
        </Link>
      ),
    },
    {
      dataIndex: 'type',
      title: t('coupon.column.type'),
      render: (_, row) => {
        const typeKey = TYPE_KEYS[row.type];
        return typeKey ? t(`coupon.type.${typeKey}`) : '--';
      },
    },
    {
      dataIndex: 'target',
      title: t('coupon.column.target'),
      filters: targetFilters,
      filteredValue: target === undefined ? null : [target],
      render: (value: number) => {
        const targetKey = TARGET_KEYS[value];
        return targetKey ? t(targetKey) : '--';
      },
    },
    {
      key: 'putTerm',
      title: t('coupon.column.putTerm'),
      render: (_, row) =>
        t('coupon.dateRange', {
          start: formatISO(row.putTerm?.[0]),
          end: formatISO(row.putTerm?.[1]),
        }),
    },
    {
      key: 'useTerm',
      title: t('coupon.column.useTerm'),
      render: (_, row) => formatUseTerm(row.useTerm, t),
    },
    {
      dataIndex: 'sendCount',
      title: t('coupon.column.sendCount'),
      sorter: true,
      sortOrder: sortOrderFor('sendCount'),
      render: (value: number) => value,
    },
    {
      dataIndex: 'leftCount',
      title: t('coupon.column.leftCount'),
      sorter: true,
      sortOrder: sortOrderFor('leftCount'),
      render: (value: number) => value,
    },
    {
      dataIndex: 'ctime',
      title: t('coupon.column.ctime'),
      sorter: true,
      sortOrder: sortOrderFor('ctime'),
      render: (_, row) => formatISO(row.ctime),
    },
    {
      dataIndex: 'status',
      title: t('coupon.column.status'),
      render: (value: number) => {
        const statusMeta = STATUS_META[value];

        return statusMeta ? (
          <Tag tone={statusMeta.tone}>{t(`coupon.status.${statusMeta.labelKey}`)}</Tag>
        ) : (
          <span>--</span>
        );
      },
    },
    {
      key: 'actions',
      title: t('coupon.column.actions'),
      render: (_, row) => (
        <div className={styles.actions}>
          <Link className={styles.link} href={`/market/coupon/${row.id}`}>
            {t('coupon.view')}
          </Link>
          {row.status < 2 ? (
            <>
              <Link className={styles.link} href={`/market/coupon/update/${row.id}`}>
                {t('coupon.edit')}
              </Link>
              <Button variant='ghost' size='sm' onClick={() => setOfflineTarget(row)}>
                {t('coupon.offline')}
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  const list = couponsQuery.data?.list ?? [];

  return (
    <PageContainer
      title={t('coupon.title')}
      description={t('coupon.description')}
      breadcrumbs={[{ label: tCommon('home'), href: '/' }, { label: t('home.title') }, { label: t('coupon.title') }]}
      actions={<CreateCouponEntry>{t('coupon.create')}</CreateCouponEntry>}
    >
      <div className={styles.filters}>
        <div className={styles.filter}>
          <span className={styles.filterLabel}>{t('coupon.statusFilterLabel')}</span>
          <Select
            aria-label={t('coupon.statusAria')}
            options={statusOptions}
            value={status}
            onChange={value => {
              setStatus(value);
              resetPage();
            }}
          />
        </div>
        <div className={styles.filter}>
          <span className={styles.filterLabel}>{t('coupon.putTimeFilterLabel')}</span>
          <DateRangePicker
            id={{ start: 'coupon-stime', end: 'coupon-etime' }}
            showTime
            placeholder={[t('coupon.putStartPlaceholder'), t('coupon.putEndPlaceholder')]}
            value={[stime, etime]}
            onChange={value => {
              setStime(value?.[0] ?? '');
              setEtime(value?.[1] ?? '');
              resetPage();
            }}
          />
        </div>
      </div>

      {couponsQuery.isError ? (
        <Empty description={tCommon('loadFailed')} />
      ) : (
        <DataTable
          columns={columns}
          data={list}
          total={couponsQuery.data?.total ?? 0}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onTableChange={handleTableChange}
          rowKey='id'
          loading={couponsQuery.isPending}
          emptyText={t('coupon.empty')}
        />
      )}

      <Dialog
        open={Boolean(offlineTarget)}
        onOpenChange={open => {
          if (!open) {
            setOfflineTarget(null);
          }
        }}
        title={t('coupon.offlineDialogTitle')}
        description={t('coupon.offlineDialogDescription')}
        footer={
          <div className={styles.dialogFooter}>
            <Button variant='secondary' onClick={() => setOfflineTarget(null)}>
              {tCommon('cancel')}
            </Button>
            <Button variant='danger' loading={offlinePending} onClick={handleOffline}>
              {tCommon('confirm')}
            </Button>
          </div>
        }
      />
    </PageContainer>
  );
}
