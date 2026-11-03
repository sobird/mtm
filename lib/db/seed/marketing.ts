import {
  AnalysisSnapshot,
  Campaign,
  Coupon,
  GoldPeriod,
  GoldStandard,
  MerchantTask,
  Message,
  Product,
  SeedMeta,
  Violation,
} from '../models';
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

  await Coupon.bulkCreate(coupons, { ignoreDuplicates: true });
  await Campaign.bulkCreate(campaigns, { ignoreDuplicates: true });
  await Message.bulkCreate(messages, { ignoreDuplicates: true });
  await Violation.bulkCreate([violation], { ignoreDuplicates: true });
  await Product.bulkCreate([product], { ignoreDuplicates: true });
  await GoldPeriod.bulkCreate([period], { ignoreDuplicates: true });
  await GoldStandard.bulkCreate(standards, { ignoreDuplicates: true });
  await MerchantTask.bulkCreate([merchantTask], { ignoreDuplicates: true });
  await AnalysisSnapshot.bulkCreate(snapshots, { ignoreDuplicates: true });

  await SeedMeta.findOrCreate({
    where: { version: MARKETING_SEED_VERSION },
    defaults: { version: MARKETING_SEED_VERSION, appliedAt: new Date() },
  });
}
