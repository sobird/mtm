import { prisma } from '../client';
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
  jsonOf,
  transformAccount,
  transformCategories,
  transformEntry,
  transformEntryTask,
  transformEntryTypes,
  transformLicenses,
  transformMenu,
  transformMenuBadges,
  transformMenuFavorites,
  transformMerchantDetail,
  transformMerchantList,
} from './transformers';

export const CORE_SEED_VERSION = '2026-11-03-core';

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
  const menuFavorites = transformMenuFavorites(favorites);
  const badges = transformMenuBadges(menuBadgesGet);
  const licenses = transformLicenses(licensesGet);
  const entry = transformEntry(entryGet);
  const entryTask = transformEntryTask(entryTaskGet);
  const templateUrl = entryTemplateUrl();
  const entryTypes = transformEntryTypes(entryTypeGet);

  for (const row of entryTypes) {
    row.templateUrl = templateUrl ?? row.templateUrl;
  }

  await prisma.$transaction([
    prisma.merchantCategory.createMany({ data: categories, skipDuplicates: true }),
    prisma.merchant.createMany({ data: [detail, ...list], skipDuplicates: true }),
    prisma.merchantAccount.createMany({ data: [account], skipDuplicates: true }),
    prisma.menuItem.createMany({ data: items, skipDuplicates: true }),
    prisma.menuBadge.createMany({ data: badges, skipDuplicates: true }),
    prisma.menuFavorite.createMany({ data: menuFavorites, skipDuplicates: true }),
    prisma.merchantLicense.createMany({ data: licenses, skipDuplicates: true }),
    prisma.merchantEntry.createMany({ data: [entry], skipDuplicates: true }),
    prisma.entryTask.createMany({ data: [entryTask], skipDuplicates: true }),
    prisma.entryType.createMany({ data: entryTypes, skipDuplicates: true }),
    prisma.referenceData.createMany({
      data: [
        { key: 'merchant-options', payload: jsonOf(dataOf(merchantOptionsGet)) },
        { key: 'venus-sign', payload: jsonOf(dataOf(venusSignGet)) },
        { key: 'venus-ocr', payload: jsonOf(dataOf(venusOcrGet)) },
        { key: 'venus-upload', payload: jsonOf(dataOf(venusUploadGet)) },
      ],
      skipDuplicates: true,
    }),
    prisma.seedMeta.upsert({
      where: { version: CORE_SEED_VERSION },
      update: { appliedAt: new Date() },
      create: { version: CORE_SEED_VERSION, appliedAt: new Date() },
    }),
  ]);
}
