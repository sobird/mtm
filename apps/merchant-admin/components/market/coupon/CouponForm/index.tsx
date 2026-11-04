'use client';

import type { Translate } from '@mtm/i18n';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';

import { Button, DateRangePicker, Field, Form, Input, Radio, Select, useToast } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { CouponDetailDTO } from '@/lib/services/coupon';
import { translateApiError } from '@/lib/translate-api-error';
import { createCouponFormSchema } from '@/lib/validation/coupon';
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

const TARGET_LABEL_KEYS: Record<number, string> = {
  1: 'target.product',
  2: 'target.universal',
  3: 'target.service',
};

function targetLabelKey(value: number): string {
  return TARGET_LABEL_KEYS[value] ?? TARGET_LABEL_KEYS[1];
}

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

function formatUseTerm(value: UseTermValue | undefined, t: Translate): string {
  const [days, range] = value ?? [];

  if (Array.isArray(range) && range[0] !== undefined && range[1] !== undefined) {
    return t('coupon.useTermRange', { start: epochToDateInput(range[0]), end: epochToDateInput(range[1]) });
  }

  return t('coupon.useTermDays', { days: days ?? '-' });
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
  initialValues: CouponDetailDTO | undefined,
  t: Translate
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
    displayName: `xx ${t(targetLabelKey(target))}`,
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
  const t = useTranslations('marketing');
  const tf = useTranslations('marketing.coupon.form');
  const options = [1, 2, 3].map(value => ({ value, label: t(targetLabelKey(value)) }));

  return (
    <Field label={tf('typeLabel')} required>
      <Select name='target' options={options} placeholder={tf('placeholder')} disabled={disabled} />
    </Field>
  );
}

function SyncDisplayName() {
  const t = useTranslations('marketing');
  const { setValue } = useFormContext();
  const target = Number(useWatch({ name: 'target' }));

  useEffect(() => {
    setValue('displayName', `xx ${t(targetLabelKey(target))}`, { shouldValidate: true });
  }, [setValue, target, t]);

  return null;
}

function DateTimeRangeField({ disabled }: { disabled?: boolean }) {
  const tf = useTranslations('marketing.coupon.form');
  const { setValue, getFieldState } = useFormContext();
  const formState = useFormState({ name: 'putTerm' });
  const value = useWatch({ name: 'putTerm' }) as [number?, number?] | undefined;
  const error = getFieldState('putTerm', formState).error?.message as string | undefined;

  return (
    <Field label={tf('putTermLabel')} required error={error}>
      <DateRangePicker
        showTime
        disabled={disabled}
        className={styles.dateRange}
        placeholder={[tf('putStart'), tf('putEnd')]}
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
  const tf = useTranslations('marketing.coupon.form');
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
    <Field label={tf('useTermLabel')} required error={error}>
      <div className={styles.terms}>
        <div className={styles.termRow}>
          <Radio
            name='useTermMode'
            checked={mode === 'days'}
            disabled={disabled}
            onChange={() => selectMode('days')}
            label={tf('claimAfter')}
          />
          <input
            type='number'
            className={styles.dayInput}
            aria-label={tf('claimDaysAria')}
            min={1}
            max={30}
            value={days ?? ''}
            disabled={disabled || mode !== 'days'}
            onChange={event => setDays(event.target.value === '' ? undefined : Number(event.target.value))}
          />
          <span className={styles.unit}>{tf('daysUnit')}</span>
        </div>

        <div className={styles.termRow}>
          <Radio
            name='useTermMode'
            checked={mode === 'range'}
            disabled={disabled}
            onChange={() => selectMode('range')}
            label={tf('custom')}
          />
          <DateRangePicker
            disabled={disabled || mode !== 'range'}
            className={styles.dateRange}
            placeholder={[tf('useStart'), tf('useEnd')]}
            value={[epochToDateInput(range?.[0]), epochToDateInput(range?.[1])]}
            onChange={next => setRange([dateInputToEpoch(next?.[0] ?? ''), dateInputToEpoch(next?.[1] ?? '')])}
          />
        </div>
      </div>
    </Field>
  );
}

function AmountRuleFields({ disabled }: { disabled?: boolean }) {
  const tf = useTranslations('marketing.coupon.form');

  return (
    <Field label={tf('thresholdLabel')} required>
      <div className={styles.rule}>
        <span className={styles.unit}>{tf('full')}</span>
        <Input
          name='rule.0'
          type='number'
          min={0}
          max={5000}
          placeholder={tf('thresholdPlaceholder')}
          aria-label={tf('thresholdAria')}
          disabled={disabled}
        />
        <span className={styles.unit}>{tf('yuan')}</span>
        <span className={styles.separator}>{tf('minus')}</span>
        <Input
          name='rule.1'
          type='number'
          min={0}
          max={5000}
          placeholder={tf('amountPlaceholder')}
          aria-label={tf('amountAria')}
          disabled={disabled}
        />
        <span className={styles.unit}>{tf('yuan')}</span>
      </div>
    </Field>
  );
}

function SubmitButton() {
  const tf = useTranslations('marketing.coupon.form');
  const { isSubmitting } = useFormState();

  return (
    <div className={styles.submit}>
      <Button type='submit' loading={isSubmitting}>
        {tf('submit')}
      </Button>
    </div>
  );
}

interface CouponFieldsProps {
  mode: CouponFormMode;
  initialValues?: CouponDetailDTO;
}

function CouponFields({ mode, initialValues }: CouponFieldsProps) {
  const tf = useTranslations('marketing.coupon.form');
  const tm = useTranslations('marketing');
  const detail = mode === 'detail';
  const disabled = mode !== 'create';
  const value = useWatch({ name: 'useTerm' }) as UseTermValue | undefined;

  const limitOptions = [
    { value: 1, label: tf('limit1') },
    { value: 2, label: tf('limit2') },
    { value: 3, label: tf('limit3') },
    { value: 4, label: tf('unlimited') },
  ];

  return (
    <>
      <TargetField disabled={disabled} />
      {detail ? null : <SyncDisplayName />}

      <Field label={tf('nameLabel')} required>
        <Input name='name' placeholder={tf('namePlaceholder')} aria-label={tf('nameLabel')} disabled={detail} />
      </Field>

      <Field label={tf('displayNameLabel')}>
        <Input name='displayName' aria-label={tf('displayNameLabel')} disabled />
      </Field>

      {detail ? (
        <Field label={tf('putTermLabel')}>
          <span className={styles.staticValue}>
            {tm('coupon.dateRange', {
              start: formatISO(initialValues?.putTerm?.[0]),
              end: formatISO(initialValues?.putTerm?.[1]),
            })}
          </span>
        </Field>
      ) : (
        <DateTimeRangeField />
      )}

      <Field label={tf('stockLabel')} required>
        <Input
          name='stock'
          type='number'
          min={1}
          max={1000000}
          placeholder={tf('stockPlaceholder')}
          aria-label={tf('stockLabel')}
          disabled={detail}
        />
      </Field>

      <AmountRuleFields disabled={detail} />

      <Field label={tf('limitLabel')} required>
        <Select name='limit' options={limitOptions} placeholder={tf('placeholder')} disabled={detail} />
      </Field>

      {detail ? (
        <Field label={tf('useTermLabel')}>
          <span className={styles.staticValue}>{formatUseTerm(value, tm)}</span>
        </Field>
      ) : (
        <UseTermField disabled={detail} />
      )}

      {detail && initialValues?.ctime ? (
        <Field label={tf('createDate')}>
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
  const tForm = useTranslations('marketing.coupon.form');
  const tm = useTranslations('marketing');
  const tRoot = useTranslations();

  const defaultValues = useMemo(
    () => buildInitialValues(mode, target, initialValues, tm),
    [mode, target, initialValues, tm]
  );
  const schema = useMemo(() => createCouponFormSchema(tRoot), [tRoot]);

  const handleSubmit = async (values: CouponFormValues) => {
    const payload = {
      ...values,
      type: 0,
      displayName: `xx ${tm(targetLabelKey(values.target))}`,
      putCrowd: -1,
      useCrowd: -1,
      position: 0,
    };

    try {
      if (mode === 'update' && couponId) {
        await apiFetch(`/api/merchant/coupon/${couponId}`, { method: 'PATCH', body: payload });
        toast.success(tForm('updateSuccess'));
        await queryClient.invalidateQueries({ queryKey: queryKeys.coupon(couponId) });
        await queryClient.invalidateQueries({ queryKey: ['coupons'] });
      } else {
        await apiFetch('/api/merchant/coupon', { method: 'POST', body: payload });
        toast.success(tForm('createSuccess'));
        await queryClient.invalidateQueries({ queryKey: ['coupons'] });
      }

      router.push('/market/coupons');
    } catch (error) {
      toast.error(translateApiError(error, tRoot, 'marketing.coupon.actionFailed'));
    }
  };

  return (
    <Form
      schema={schema}
      defaultValues={defaultValues}
      onSubmit={mode === 'detail' ? () => undefined : handleSubmit}
      className={styles.form}
    >
      <CouponFields mode={mode} initialValues={initialValues} />
    </Form>
  );
}

export default CouponForm;
