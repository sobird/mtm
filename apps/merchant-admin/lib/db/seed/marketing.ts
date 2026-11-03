import { prisma } from '../client';
import operationGet from './data/market/analysis/operation/get.json';
import trendingGet from './data/market/analysis/trending/get.json';
import workbenchGet from './data/market/analysis/workbench/get.json';
import campaignsGet from './data/market/merchant/campaigns/get.json';
import couponDetailGet from './data/market/merchant/coupon/detail/get.json';
import couponGet from './data/market/merchant/coupon/get.json';
import goldGet from './data/market/merchant/gold/get.json';
import taskGet from './data/market/merchant/task/list/get.json';
import messageDetailGet from './data/market/message/detail/get.json';
import latestNewsGet from './data/market/message/latest-news/get.json';
import productSellingGet from './data/market/product/selling/get.json';
import violationOverviewGet from './data/market/violation/overview/get.json';
import {
  transformAnalysisSnapshot,
  transformCampaigns,
  transformCouponDetail,
  transformCouponList,
  transformGold,
  transformLatestNews,
  transformMerchantTasks,
  transformMessageDetail,
  transformProductSelling,
  transformViolationOverview,
} from './transformers';

export const MARKETING_SEED_VERSION = '2026-11-03-marketing';

// The analysis mocks carry no date, so every snapshot shares one fixed period.
const ANALYSIS_PERIOD = '2026-11-03';

export async function seedMarketing(): Promise<void> {
  const coupons = [...transformCouponList(couponGet), transformCouponDetail(couponDetailGet)];
  const campaigns = transformCampaigns(campaignsGet);
  const messages = [...transformLatestNews(latestNewsGet), ...transformMessageDetail(messageDetailGet)];
  const violation = transformViolationOverview(violationOverviewGet);
  const product = transformProductSelling(productSellingGet);
  const { period, standards } = transformGold(goldGet);
  const merchantTask = transformMerchantTasks(taskGet);
  const snapshots = [
    transformAnalysisSnapshot(workbenchGet, 'workbench', ANALYSIS_PERIOD),
    transformAnalysisSnapshot(trendingGet, 'trending', ANALYSIS_PERIOD),
    transformAnalysisSnapshot(operationGet, 'operation', ANALYSIS_PERIOD),
  ];

  await prisma.$transaction([
    prisma.coupon.createMany({ data: coupons, skipDuplicates: true }),
    prisma.campaign.createMany({ data: campaigns, skipDuplicates: true }),
    prisma.message.createMany({ data: messages, skipDuplicates: true }),
    prisma.violation.createMany({ data: [violation], skipDuplicates: true }),
    prisma.product.createMany({ data: [product], skipDuplicates: true }),
    prisma.goldPeriod.createMany({ data: [period], skipDuplicates: true }),
    prisma.goldStandard.createMany({ data: standards, skipDuplicates: true }),
    prisma.merchantTask.createMany({ data: [merchantTask], skipDuplicates: true }),
    prisma.analysisSnapshot.createMany({ data: snapshots, skipDuplicates: true }),
    prisma.seedMeta.upsert({
      where: { version: MARKETING_SEED_VERSION },
      update: { appliedAt: new Date() },
      create: { version: MARKETING_SEED_VERSION, appliedAt: new Date() },
    }),
  ]);
}
