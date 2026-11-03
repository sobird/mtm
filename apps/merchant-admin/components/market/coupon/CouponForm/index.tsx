'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';

import { Button, DateRangePicker, Field, Form, Input, Radio, Select, useToast } from '@/components/ui';
import { ApiError, apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { CouponDetailDTO } from '@/lib/services/coupon';
import { couponFormSchema } from '@/lib/validation/coupon';
import type { CouponFormValues } from '@/lib/validation/coupon';

import styles from './CouponForm.module.css';

export type CouponFormMode = 'create' | 'update' | 'detail';

export interface CouponFormProps {
  mode: CouponFormMode;
  /** Default target used by the create page. */
  target?: number;
  couponId?: string;
  initialValues?: CouponDetailDTO;
}

const TARGET_LABELS: Record<number, string> = {
  1: '店铺商品券',
  2: '店铺通用券',
  3: '店铺客服体验券',
};

const TARGET_OPTIONS = [1, 2, 3].map(value => ({ value, label: TARGET_LABELS[value] }));

const LIMIT_OPTIONS = [
  { value: 1, label: '1张' },
  { value: 2, label: '2张' },
  { value: 3, label: '3张' },
  { value: 4, label: '不限' },
];

type UseTermValue = [number?, [number?, number?]?];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function epochToDateTimeInput(seconds: unknown): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) {
    return '';
  }

  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function dateTimeInputToEpoch(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? Math.floor(time / 1000) : undefined;
}

function epochToDateInput(seconds: unknown): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) {
    return '';
  }

  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateInputToEpoch(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const time = new Date(`${value}T00:00:00`).getTime();
  return Number.isFinite(time) ? Math.floor(time / 1000) : undefined;
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

function formatUseTerm(value: UseTermValue | undefined): string {
  const [days, range] = value ?? [];

  if (Array.isArray(range) && range[0] !== undefined && range[1] !== undefined) {
    return `${epochToDateInput(range[0])} 到 ${epochToDateInput(range[1])}`;
  }

  return `领取后 ${days ?? '-'} 天`;
}

function normalizeUseTerm(value: unknown): UseTermValue {
  if (!Array.isArray(value)) {
    return [1];
  }

  const days = typeof value[0] === 'number' ? value[0] : 1;
  const rawRange = value[1];

  if (Array.isArray(rawRange) && rawRange.length >= 2) {
    return [days, [Number(rawRange[0]), Number(rawRange[1])]];
  }

  return [days];
}

function isoToEpoch(iso: string | null | undefined): number | undefined {
  if (!iso) {
    return undefined;
  }

  const time = new Date(iso).getTime();
  return Number.isFinite(time) ? Math.floor(time / 1000) : undefined;
}

function buildInitialValues(
  mode: CouponFormMode,
  target: number,
  initialValues?: CouponDetailDTO
): Partial<CouponFormValues> {
  if (mode !== 'create' && initialValues) {
    const putTerm = Array.isArray(initialValues.putTerm)
      ? [isoToEpoch(initialValues.putTerm[0]), isoToEpoch(initialValues.putTerm[1])]
      : undefined;

    return {
      name: initialValues.name,
      displayName: initialValues.displayName,
      type: initialValues.type ?? 0,
      target: initialValues.target ?? 1,
      rule: Array.isArray(initialValues.rule) ? (initialValues.rule as [number, number]) : [0, 0],
      stock: initialValues.stock ?? 1,
      limit: initialValues.limit ?? 1,
      putTerm: putTerm ?? [undefined, undefined],
      putCrowd: initialValues.putCrowd ?? -1,
      useTerm: normalizeUseTerm(initialValues.useTerm),
      useCrowd: initialValues.useCrowd ?? -1,
      position: initialValues.position ?? 0,
    };
  }

  return {
    name: '',
    displayName: `xx ${TARGET_LABELS[target] ?? TARGET_LABELS[1]}`,
    type: 0,
    target,
    rule: [0, 0],
    stock: 1,
    limit: 1,
    putTerm: [undefined, undefined],
    putCrowd: -1,
    useTerm: [1],
    useCrowd: -1,
    position: 0,
  };
}

function TargetField({ disabled }: { disabled?: boolean }) {
  return (
    <Field label='优惠券类型' required>
      <Select name='target' options={TARGET_OPTIONS} placeholder='请选择' disabled={disabled} />
    </Field>
  );
}

function SyncDisplayName() {
  const { setValue } = useFormContext();
  const target = Number(useWatch({ name: 'target' }));

  useEffect(() => {
    setValue('displayName', `xx ${TARGET_LABELS[target] ?? ''}`, { shouldValidate: true });
  }, [setValue, target]);

  return null;
}

function DateTimeRangeField({ disabled }: { disabled?: boolean }) {
  const { setValue, getFieldState } = useFormContext();
  const formState = useFormState({ name: 'putTerm' });
  const value = useWatch({ name: 'putTerm' }) as [number?, number?] | undefined;
  const error = getFieldState('putTerm', formState).error?.message as string | undefined;

  return (
    <Field label='发放时间' required error={error}>
      <DateRangePicker
        showTime
        disabled={disabled}
        className={styles.dateRange}
        placeholder={['发放开始时间', '发放结束时间']}
        value={[epochToDateTimeInput(value?.[0]), epochToDateTimeInput(value?.[1])]}
        onChange={next =>
          setValue('putTerm', [dateTimeInputToEpoch(next?.[0] ?? ''), dateTimeInputToEpoch(next?.[1] ?? '')], {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      />
    </Field>
  );
}

function UseTermField({ disabled }: { disabled?: boolean }) {
  const { setValue, getFieldState } = useFormContext();
  const formState = useFormState({ name: 'useTerm' });
  const value = useWatch({ name: 'useTerm' }) as UseTermValue | undefined;
  const error = getFieldState('useTerm', formState).error?.message as string | undefined;

  const [mode, setMode] = useState<'days' | 'range'>(value?.[1] ? 'range' : 'days');
  const days = value?.[0];
  const range = value?.[1];

  const setDays = (next: number | undefined) => {
    if (mode === 'range') {
      setValue('useTerm', [next, range], { shouldValidate: true, shouldDirty: true });
      return;
    }

    setValue('useTerm', [next], { shouldValidate: true, shouldDirty: true });
  };

  const setRange = (next: [number?, number?]) => {
    setValue('useTerm', [days ?? 1, next], { shouldValidate: true, shouldDirty: true });
  };

  const selectMode = (nextMode: 'days' | 'range') => {
    setMode(nextMode);

    if (nextMode === 'days') {
      setValue('useTerm', [days ?? 1], { shouldValidate: true, shouldDirty: true });
      return;
    }

    setValue('useTerm', [days ?? 1, range ?? [undefined, undefined]], { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Field label='使用时间' required error={error}>
      <div className={styles.terms}>
        <div className={styles.termRow}>
          <Radio
            name='useTermMode'
            checked={mode === 'days'}
            disabled={disabled}
            onChange={() => selectMode('days')}
            label='领取后'
          />
          <input
            type='number'
            className={styles.dayInput}
            aria-label='领取后天数'
            min={1}
            max={30}
            value={days ?? ''}
            disabled={disabled || mode !== 'days'}
            onChange={event => setDays(event.target.value === '' ? undefined : Number(event.target.value))}
          />
          <span className={styles.unit}>天</span>
        </div>

        <div className={styles.termRow}>
          <Radio
            name='useTermMode'
            checked={mode === 'range'}
            disabled={disabled}
            onChange={() => selectMode('range')}
            label='自定义'
          />
          <DateRangePicker
            disabled={disabled || mode !== 'range'}
            className={styles.dateRange}
            placeholder={['使用开始日期', '使用结束日期']}
            value={[epochToDateInput(range?.[0]), epochToDateInput(range?.[1])]}
            onChange={next => setRange([dateInputToEpoch(next?.[0] ?? ''), dateInputToEpoch(next?.[1] ?? '')])}
          />
        </div>
      </div>
    </Field>
  );
}

function AmountRuleFields({ disabled }: { disabled?: boolean }) {
  return (
    <Field label='门槛及面额' required>
      <div className={styles.rule}>
        <span className={styles.unit}>满</span>
        <Input
          name='rule.0'
          type='number'
          min={0}
          max={5000}
          placeholder='请输入门槛'
          aria-label='满减门槛'
          disabled={disabled}
        />
        <span className={styles.unit}>元</span>
        <span className={styles.separator}>减</span>
        <Input
          name='rule.1'
          type='number'
          min={0}
          max={5000}
          placeholder='请输入面额'
          aria-label='优惠面额'
          disabled={disabled}
        />
        <span className={styles.unit}>元</span>
      </div>
    </Field>
  );
}

function SubmitButton() {
  const { isSubmitting } = useFormState();

  return (
    <div className={styles.submit}>
      <Button type='submit' loading={isSubmitting}>
        提交
      </Button>
    </div>
  );
}

interface CouponFieldsProps {
  mode: CouponFormMode;
  initialValues?: CouponDetailDTO;
}

function CouponFields({ mode, initialValues }: CouponFieldsProps) {
  const detail = mode === 'detail';
  const disabled = mode !== 'create';
  const value = useWatch({ name: 'useTerm' }) as UseTermValue | undefined;

  return (
    <>
      <TargetField disabled={disabled} />
      {detail ? null : <SyncDisplayName />}

      <Field label='优惠券名称' required>
        <Input name='name' placeholder='请填写优惠券名称' aria-label='优惠券名称' disabled={detail} />
      </Field>

      <Field label='优惠券文案'>
        <Input name='displayName' aria-label='优惠券文案' disabled />
      </Field>

      {detail ? (
        <Field label='发放时间'>
          <span className={styles.staticValue}>
            {formatISO(initialValues?.putTerm?.[0])} 至 {formatISO(initialValues?.putTerm?.[1])}
          </span>
        </Field>
      ) : (
        <DateTimeRangeField />
      )}

      <Field label='发放张数' required>
        <Input
          name='stock'
          type='number'
          min={1}
          max={1000000}
          placeholder='请输入1-1,000,000的正整数'
          aria-label='发放张数'
          disabled={detail}
        />
      </Field>

      <AmountRuleFields disabled={detail} />

      <Field label='每人限领张数' required>
        <Select name='limit' options={LIMIT_OPTIONS} placeholder='请选择' disabled={detail} />
      </Field>

      {detail ? (
        <Field label='使用时间'>
          <span className={styles.staticValue}>{formatUseTerm(value)}</span>
        </Field>
      ) : (
        <UseTermField disabled={detail} />
      )}

      {detail && initialValues?.ctime ? (
        <Field label='创建日期'>
          <span className={styles.staticValue}>{formatISO(initialValues.ctime)}</span>
        </Field>
      ) : null}

      {detail ? null : <SubmitButton />}
    </>
  );
}

export function CouponForm({ mode, target = 1, couponId, initialValues }: CouponFormProps) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const defaultValues = useMemo(() => buildInitialValues(mode, target, initialValues), [mode, target, initialValues]);

  const handleSubmit = async (values: CouponFormValues) => {
    const payload = {
      ...values,
      type: 0,
      displayName: `xx ${TARGET_LABELS[values.target] ?? ''}`,
      putCrowd: -1,
      useCrowd: -1,
      position: 0,
    };

    try {
      if (mode === 'update' && couponId) {
        await apiFetch(`/api/merchant/coupon/${couponId}`, { method: 'PATCH', body: payload });
        toast.success('更新优惠券成功');
        await queryClient.invalidateQueries({ queryKey: queryKeys.coupon(couponId) });
        await queryClient.invalidateQueries({ queryKey: ['coupons'] });
      } else {
        await apiFetch('/api/merchant/coupon', { method: 'POST', body: payload });
        toast.success('创建优惠券成功');
        await queryClient.invalidateQueries({ queryKey: ['coupons'] });
      }

      router.push('/market/coupons');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : '操作失败，请稍后重试');
    }
  };

  return (
    <Form
      schema={couponFormSchema}
      defaultValues={defaultValues}
      onSubmit={mode === 'detail' ? () => undefined : handleSubmit}
      className={styles.form}
    >
      <CouponFields mode={mode} initialValues={initialValues} />
    </Form>
  );
}

export default CouponForm;
