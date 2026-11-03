import type {
  AccountCreationAttributes,
  EntryTaskCreationAttributes,
  EntryTypeCreationAttributes,
  MenuBadgeCreationAttributes,
  MenuItemCreationAttributes,
  MerchantCategoryCreationAttributes,
  MerchantCreationAttributes,
  MerchantEntryCreationAttributes,
  MerchantLicenseCreationAttributes,
} from '../models';

export type MenuItemRow = MenuItemCreationAttributes;
export type MenuBadgeRow = MenuBadgeCreationAttributes;
export type MerchantCategoryRow = MerchantCategoryCreationAttributes;
export type MerchantRow = MerchantCreationAttributes;
export type AccountRow = AccountCreationAttributes;
export type MerchantLicenseRow = MerchantLicenseCreationAttributes;
export type MerchantEntryRow = MerchantEntryCreationAttributes;
export type EntryTaskRow = EntryTaskCreationAttributes;
export type EntryTypeRow = EntryTypeCreationAttributes;

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return typeof value === 'object' && value !== null;
}

/** Reads the `data` member of a mock envelope, falling back to the body itself. */
export function dataOf(raw: unknown): unknown {
  return isRecord(raw) && 'data' in raw ? raw.data : raw;
}

function record(value: unknown): RawRecord {
  return isRecord(value) ? value : {};
}

function list(value: unknown): RawRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function str(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
}

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function normalizeMenuItem(row: RawRecord): MenuItemRow {
  return {
    id: str(row.id),
    parentId: str(row.parentId),
    title: str(row.title),
    icon: str(row.icon),
    url: str(row.url),
    code: str(row.code),
    auth: bool(row.auth),
    index: str(row.index),
    level: num(row.level),
    sortId: num(row.sortId),
    toolMenu: bool(row.toolMenu),
  };
}

export function transformMenu(raw: unknown): { items: MenuItemRow[]; favorites: MenuItemRow[] } {
  const data = record(dataOf(raw));

  return {
    items: list(data.menuItems).map(normalizeMenuItem),
    favorites: list(data.favorites).map(normalizeMenuItem),
  };
}

export function transformMenuBadges(raw: unknown): MenuBadgeRow[] {
  return list(dataOf(raw)).map(row => ({
    menuId: str(row.menuId),
    actionType: num(row.actionType),
    noticeStyle: num(row.noticeStyle),
    noticeContent: str(row.noticeContent),
  }));
}

export function transformCategories(raw: unknown): MerchantCategoryRow[] {
  return list(dataOf(raw)).map(row => ({
    id: num(row.id),
    parentId: num(row.parentId),
    name: str(row.name),
    level: num(row.level),
  }));
}

export function transformMerchantList(raw: unknown): MerchantRow[] {
  return list(dataOf(raw)).map(row => ({
    id: num(row.id),
    name: str(row.name),
    status: num(row.state, num(row.status)),
    type: num(row.merchantType, num(row.type)),
    payload: row,
  }));
}

export function transformMerchantDetail(raw: unknown): MerchantRow {
  const data = record(dataOf(raw));
  const shopInfo = record(data.shopInfo);

  return {
    id: 1,
    name: str(shopInfo.name, str(data.name)),
    status: num(data.state, num(data.status)),
    type: num(data.merchantType, num(data.type)),
    payload: data,
  };
}

/**
 * The login account is a fixed demo identity: the id from `account/get.json`
 * (160474295) must not leak into the seed.
 */
export function transformAccount(raw: unknown): AccountRow {
  const data = record(dataOf(raw));

  return {
    id: 1,
    login: str(data.login, 'mt087320v'),
    mobile: '13412345678',
    interCode: '86',
    merchantId: 1,
  };
}

export function transformLicenses(raw: unknown): MerchantLicenseRow[] {
  return list(dataOf(raw)).map(row => ({
    id: num(row.id),
    merchantId: 1,
    type: num(row.type),
    name: str(row.licenseTypeStr, str(row.name)),
    url: str(row.src, str(row.license, str(row.url))),
    status: num(row.auditStatus, num(row.status)),
    expireAt: str(row.expireDate, str(row.expireAt)),
  }));
}

export function transformEntry(raw: unknown): MerchantEntryRow {
  const data = record(dataOf(raw));
  const base = record(data.base);
  const audit = record(data.audit);

  return {
    merchantId: 1,
    step: num(data.step, num(base.state)),
    status: num(audit.auditState, num(data.status)),
    payload: data,
  };
}

export function transformEntryTask(raw: unknown): EntryTaskRow {
  const data = record(dataOf(raw));
  const audit = record(data.audit);

  return {
    id: num(data.entryTaskId, num(data.id)),
    merchantId: 1,
    bizType: num(data.bizType),
    localCommerce: num(data.localCommerce),
    status: num(data.status, num(audit.auditState)),
  };
}

export function transformEntryTypes(raw: unknown): EntryTypeRow[] {
  return list(dataOf(raw)).map(row => ({
    code: str(row.poiType, str(row.code)),
    name: str(row.poiTypeName, str(row.name)),
    templateUrl: str(row.templateUrl, str(row.template_url)) || null,
    payload: row,
  }));
}
