import type { AnalysisKey } from '@/lib/db/models';
import { AnalysisSnapshot } from '@/lib/db/models';

import { AppError } from '../errors';

export interface WorkbenchOverviewDTO {
  unpaidOrderCount: number;
  unfilledOrderCount: number;
  refundOrderCount: number;
  willDelayDeliverOrderCount: number;
  delayedDeliverOrderCount: number;
}

export interface WorkbenchRealdataDTO {
  paidAmount: number;
  paidOrderCount: number;
  paidUserCount: number;
  itemUniqueVisitor: number;
  itemPaveView: number;
  conversionRate: number;
}

export interface WorkbenchDTO {
  overview: WorkbenchOverviewDTO;
  realdata: WorkbenchRealdataDTO;
}

export interface TrendingPointDTO {
  date?: string;
  value?: number;
  [key: string]: unknown;
}

export interface TrendingDTO {
  transactionLine: TrendingPointDTO[];
  paymentAmountLine: TrendingPointDTO[];
  reviewLine: TrendingPointDTO[];
  serviceReplyRateLine: TrendingPointDTO[];
}

export interface OperationScoreSetDTO {
  serviceScoreJudge: number;
  overallScoreJudge: number;
  serviceScore: number;
  overallScore: number;
}

export interface OperationRateSetDTO {
  customerReplyRate: number;
  collectOnTimeRate: number;
  newlyReviewCount: number;
}

export interface OperationDTO {
  scoreSet: OperationScoreSetDTO;
  rateSet: OperationRateSetDTO;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

async function getSnapshot<T>(key: AnalysisKey): Promise<T> {
  const row = await AnalysisSnapshot.findByPk(key);

  if (!row) {
    throw new AppError('NOT_FOUND', 404, '分析数据不存在');
  }

  return asRecord(row.payload) as unknown as T;
}

export function getWorkbench(): Promise<WorkbenchDTO> {
  return getSnapshot<WorkbenchDTO>('workbench');
}

export function getTrending(): Promise<TrendingDTO> {
  return getSnapshot<TrendingDTO>('trending');
}

export function getOperation(): Promise<OperationDTO> {
  return getSnapshot<OperationDTO>('operation');
}
