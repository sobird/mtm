'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { PageContainer } from '@/components/layout/PageContainer';
import CreateCouponEntry from '@/components/market/coupon/CreateCouponEntry';
import { Button, DataTable, DateRangePicker, Dialog, Empty, Select, Tag, useToast } from '@/components/ui';
import type { DataTableChange, DataTableColumns, SelectOptionValue, TagTone } from '@/components/ui';
import { ApiError, apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { CouponListItemDTO } from '@/lib/services/coupon';

import styles from './page.module.css';

const PAGE_SIZE = 10;

interface CouponListResponse {
  total: number;
  pn: number;
  ps: number;
  list: CouponListItemDTO[];
}

const STATUS_OPTIONS = [
  { value: -1, label: '全部' },
  { value: 0, label: '未开始' },
  { value: 1, label: '进行中' },
  { value: 2, label: '已结束' },
  { value: 6, label: '已下线' },
];

const STATUS_MAP: Record<number, { label: string; tone: TagTone }> = {
  0: { label: '未开始', tone: 'neutral' },
  1: { label: '进行中', tone: 'success' },
  2: { label: '已结束', tone: 'info' },
  6: { label: '已下线', tone: 'danger' },
};

const TYPE_MAP: Record<number, string> = {
  0: '满减券',
  1: '折扣券',
};

const TARGET_MAP: Record<number, string> = {
  1: '店铺商品券',
  2: '店铺通用券',
  3: '店铺客服体验券',
};

const TARGET_FILTERS = [
  { text: '店铺商品券', value: 1 },
  { text: '店铺通用券', value: 2 },
  { text: '店铺客服体验券', value: 3 },
];

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

function formatUseTerm(value: unknown): string {
  if (!Array.isArray(value)) {
    return '--';
  }

  const [days, range] = value;

  if (Array.isArray(range) && range.length >= 2) {
    return `${formatEpochDate(range[0])} 到 ${formatEpochDate(range[1])}`;
  }

  return `领取后 ${typeof days === 'number' ? days : '-'} 天`;
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

  const [status, setStatus] = useState<SelectOptionValue>(-1);
  const [stime, setStime] = useState('');
  const [etime, setEtime] = useState('');
  const [target, setTarget] = useState<number | undefined>();
  const [sort, setSort] = useState<SortKey | undefined>();
  const [order, setOrder] = useState<SortDirection | undefined>();
  const [page, setPage] = useState(1);

  const [offlineTarget, setOfflineTarget] = useState<CouponListItemDTO | null>(null);
  const [offlinePending, setOfflinePending] = useState(false);

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
      toast.success('优惠券已下线');
      await queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setOfflineTarget(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : '下线失败，请稍后重试');
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
      title: '优惠券编码',
      render: (_, row) => row.id,
    },
    {
      dataIndex: 'name',
      title: '优惠券名称',
      render: (_, row) => (
        <Link className={styles.link} href={`/market/coupon/${row.id}`}>
          {row.name}
        </Link>
      ),
    },
    {
      dataIndex: 'type',
      title: '优惠类型',
      render: (_, row) => TYPE_MAP[row.type] ?? '--',
    },
    {
      dataIndex: 'target',
      title: '券类型',
      filters: TARGET_FILTERS,
      filteredValue: target === undefined ? null : [target],
      render: (value: number) => TARGET_MAP[value] ?? '--',
    },
    {
      key: 'putTerm',
      title: '发放时段',
      render: (_, row) => `${formatISO(row.putTerm?.[0])} 至 ${formatISO(row.putTerm?.[1])}`,
    },
    {
      key: 'useTerm',
      title: '使用时间',
      render: (_, row) => formatUseTerm(row.useTerm),
    },
    {
      dataIndex: 'sendCount',
      title: '发放数量',
      sorter: true,
      sortOrder: sortOrderFor('sendCount'),
      render: (value: number) => value,
    },
    {
      dataIndex: 'leftCount',
      title: '当前余量',
      sorter: true,
      sortOrder: sortOrderFor('leftCount'),
      render: (value: number) => value,
    },
    {
      dataIndex: 'ctime',
      title: '创建时间',
      sorter: true,
      sortOrder: sortOrderFor('ctime'),
      render: (_, row) => formatISO(row.ctime),
    },
    {
      dataIndex: 'status',
      title: '状态',
      render: (value: number) => {
        const statusMeta = STATUS_MAP[value];

        return statusMeta ? <Tag tone={statusMeta.tone}>{statusMeta.label}</Tag> : <span>--</span>;
      },
    },
    {
      key: 'actions',
      title: '操作',
      render: (_, row) => (
        <div className={styles.actions}>
          <Link className={styles.link} href={`/market/coupon/${row.id}`}>
            查看
          </Link>
          {row.status < 2 ? (
            <>
              <Link className={styles.link} href={`/market/coupon/update/${row.id}`}>
                编辑
              </Link>
              <Button variant='ghost' size='sm' onClick={() => setOfflineTarget(row)}>
                下线
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
      title='优惠券'
      description='高级表单常见于一次性输入和提交大批量数据的场景。'
      breadcrumbs={[{ label: '首页', href: '/' }, { label: '营销中心' }, { label: '优惠券' }]}
      actions={<CreateCouponEntry>创建优惠券</CreateCouponEntry>}
    >
      <div className={styles.filters}>
        <div className={styles.filter}>
          <span className={styles.filterLabel}>状态</span>
          <Select
            aria-label='优惠券状态'
            options={STATUS_OPTIONS}
            value={status}
            onChange={value => {
              setStatus(value);
              resetPage();
            }}
          />
        </div>
        <div className={styles.filter}>
          <span className={styles.filterLabel}>发放时间</span>
          <DateRangePicker
            showTime
            placeholder={['发放开始', '发放结束']}
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
        <Empty description='加载失败' />
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
          emptyText='暂无优惠券'
        />
      )}

      <Dialog
        open={Boolean(offlineTarget)}
        onOpenChange={open => {
          if (!open) {
            setOfflineTarget(null);
          }
        }}
        title='下线优惠券'
        description='您确定要下线该优惠券吗？'
        footer={
          <div className={styles.dialogFooter}>
            <Button variant='secondary' onClick={() => setOfflineTarget(null)}>
              取消
            </Button>
            <Button variant='danger' loading={offlinePending} onClick={handleOffline}>
              确定
            </Button>
          </div>
        }
      />
    </PageContainer>
  );
}
