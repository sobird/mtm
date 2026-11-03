'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useState } from 'react';

import { PageContainer } from '@/components/layout/PageContainer';
import CreateCouponEntry from '@/components/market/coupon/CreateCouponEntry';
import { Button, DataTable, Dialog, Empty, Select, Tag, useToast } from '@/components/ui';
import type { SelectOptionValue, TagTone } from '@/components/ui';
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
  const [page, setPage] = useState(1);

  const [offlineTarget, setOfflineTarget] = useState<CouponListItemDTO | null>(null);
  const [offlinePending, setOfflinePending] = useState(false);

  const params = {
    pn: page,
    ps: PAGE_SIZE,
    status: status === -1 ? undefined : Number(status),
    stime: toEpoch(stime),
    etime: toEpoch(etime),
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

  const columns: ColumnDef<CouponListItemDTO>[] = [
    {
      accessorKey: 'id',
      header: '优惠券编码',
      cell: ({ row }) => row.original.id,
    },
    {
      accessorKey: 'name',
      header: '优惠券名称',
      cell: ({ row }) => (
        <Link className={styles.link} href={`/market/coupon/${row.original.id}`}>
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'type',
      header: '优惠类型',
      cell: ({ row }) => TYPE_MAP[row.original.type] ?? '--',
    },
    {
      accessorKey: 'target',
      header: '券类型',
      cell: ({ row }) => TARGET_MAP[row.original.target] ?? '--',
    },
    {
      id: 'putTerm',
      header: '发放时段',
      cell: ({ row }) => `${formatISO(row.original.putTerm?.[0])} 至 ${formatISO(row.original.putTerm?.[1])}`,
    },
    {
      id: 'useTerm',
      header: '使用时间',
      cell: ({ row }) => formatUseTerm(row.original.useTerm),
    },
    {
      accessorKey: 'sendCount',
      header: '发放数量',
      cell: ({ row }) => row.original.sendCount,
    },
    {
      accessorKey: 'leftCount',
      header: '当前余量',
      cell: ({ row }) => row.original.leftCount,
    },
    {
      accessorKey: 'ctime',
      header: '创建时间',
      cell: ({ row }) => formatISO(row.original.ctime),
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const statusMeta = STATUS_MAP[row.original.status];

        return statusMeta ? <Tag tone={statusMeta.tone}>{statusMeta.label}</Tag> : <span>--</span>;
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <div className={styles.actions}>
          <Link className={styles.link} href={`/market/coupon/${row.original.id}`}>
            查看
          </Link>
          {row.original.status < 2 ? (
            <>
              <Link className={styles.link} href={`/market/coupon/update/${row.original.id}`}>
                编辑
              </Link>
              <Button variant='ghost' size='sm' onClick={() => setOfflineTarget(row.original)}>
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
          <input
            type='datetime-local'
            className={styles.dateInput}
            aria-label='发放开始时间'
            value={stime}
            onChange={event => {
              setStime(event.target.value);
              resetPage();
            }}
          />
          <span className={styles.separator}>至</span>
          <input
            type='datetime-local'
            className={styles.dateInput}
            aria-label='发放结束时间'
            value={etime}
            onChange={event => {
              setEtime(event.target.value);
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
