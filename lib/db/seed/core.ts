import {
  Account,
  EntryTask,
  EntryType,
  MenuBadge,
  MenuFavorite,
  MenuItem,
  Merchant,
  MerchantCategory,
  MerchantEntry,
  MerchantLicense,
  ReferenceData,
  SeedMeta,
} from '../models';
import accountGet from './data/main/account/get.json';
import menuBadgesGet from './data/main/menu/badges/get.json';
import menuGet from './data/main/menu/get.json';
import categoryGet from './data/main/merchant/category/get.json';
import detailGet from './data/main/merchant/detail/get.json';
import entryGet from './data/main/merchant/entry/get.json';
import entryTaskGet from './data/main/merchant/entry/task/get.json';
import entryTemplateUrlGet from './data/main/merchant/entry/templateUrl/get.json';
import entryTypeGet from './data/main/merchant/entry/type/get.json';
import licensesGet from './data/main/merchant/licenses/get.json';
import merchantListGet from './data/main/merchant/list/get.json';
import merchantOptionsGet from './data/main/merchant/options/get.json';
import venusOcrGet from './data/main/venus/ocr/get.json';
import venusSignGet from './data/main/venus/sign/get.json';
import venusUploadGet from './data/main/venus/upload/post.json';
import {
  dataOf,
  transformAccount,
  transformCategories,
  transformEntry,
  transformEntryTask,
  transformEntryTypes,
  transformLicenses,
  transformMenu,
  transformMenuBadges,
  transformMerchantDetail,
  transformMerchantList,
} from './transformers';

export const CORE_SEED_VERSION = '2026-11-03-core';

const FIXED_ACCOUNT_ID = 1;

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function entryTemplateUrl(): string | null {
  const data = record(dataOf(entryTemplateUrlGet));

  return typeof data.entryHandbookUrl === 'string' ? data.entryHandbookUrl : null;
}

export async function seedCore(): Promise<void> {
  const categories = transformCategories(categoryGet);
  const detail = transformMerchantDetail(detailGet);
  const list = transformMerchantList(merchantListGet);
  const account = transformAccount(accountGet);
  const { items, favorites } = transformMenu(menuGet);
  const badges = transformMenuBadges(menuBadgesGet);
  const licenses = transformLicenses(licensesGet);
  const entry = transformEntry(entryGet);
  const entryTask = transformEntryTask(entryTaskGet);
  const templateUrl = entryTemplateUrl();
  const entryTypes = transformEntryTypes(entryTypeGet);

  for (const row of entryTypes) {
    row.templateUrl = templateUrl ?? row.templateUrl;
  }

  await MerchantCategory.bulkCreate(categories, { ignoreDuplicates: true });
  await Merchant.bulkCreate([detail, ...list], { ignoreDuplicates: true });
  await Account.bulkCreate([account], { ignoreDuplicates: true });
  await MenuItem.bulkCreate(items, { ignoreDuplicates: true });
  await MenuBadge.bulkCreate(badges, { ignoreDuplicates: true });
  await MenuFavorite.bulkCreate(
    favorites.map((favorite, index) => ({
      accountId: FIXED_ACCOUNT_ID,
      menuId: favorite.id,
      sortIndex: index,
    })),
    { ignoreDuplicates: true }
  );
  await MerchantLicense.bulkCreate(licenses, { ignoreDuplicates: true });
  await MerchantEntry.bulkCreate([entry], { ignoreDuplicates: true });
  await EntryTask.bulkCreate([entryTask], { ignoreDuplicates: true });
  await EntryType.bulkCreate(entryTypes, { ignoreDuplicates: true });

  await ReferenceData.bulkCreate(
    [
      { key: 'merchant-options', payload: dataOf(merchantOptionsGet) },
      { key: 'venus-sign', payload: dataOf(venusSignGet) },
      { key: 'venus-ocr', payload: dataOf(venusOcrGet) },
      { key: 'venus-upload', payload: dataOf(venusUploadGet) },
    ],
    { ignoreDuplicates: true }
  );

  await SeedMeta.findOrCreate({
    where: { version: CORE_SEED_VERSION },
    defaults: { version: CORE_SEED_VERSION, appliedAt: new Date() },
  });
}
