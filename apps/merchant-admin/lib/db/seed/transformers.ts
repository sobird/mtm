import {
  SEED_ACCOUNT_ID,
  SEED_GOLD_PERIOD_ID,
  SEED_MERCHANT_ID,
  SEED_MERCHANT_TASK_ID,
  SEED_PRODUCT_ID,
  SEED_VIOLATION_ID,
} from './ids';
import type {
  AccountRow,
  AnalysisKey,
  AnalysisSnapshotRow,
  CampaignRow,
  CouponRow,
  EntryTaskRow,
  EntryTypeRow,
  GoldPeriodRow,
  GoldStandardRow,
  JsonValue,
  MenuBadgeRow,
  MenuFavoriteRow,
  MenuItemRow,
  MerchantCategoryRow,
  MerchantEntryRow,
  MerchantLicenseRow,
  MerchantRow,
  MerchantTaskRow,
  MessageRow,
  ProductRow,
  ViolationRow,
} from './types';

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

function nullableNum(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function nullableStr(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return String(value);
}

/** The mock JSON is trusted, so the payload can be handed to Prisma as JSON. */
export function jsonOf(value: unknown): JsonValue {
  return value as JsonValue;
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

export function transformMenuFavorites(items: MenuItemRow[]): MenuFavoriteRow[] {
  return items.map((favorite, index) => ({
    accountId: SEED_ACCOUNT_ID,
    menuId: favorite.id,
    sortIndex: index,
  }));
}

export function transformCategories(raw: unknown): MerchantCategoryRow[] {
  return list(dataOf(raw)).map(row => ({
    id: String(row.id),
    parentId: String(row.parentId),
    name: str(row.name),
    level: num(row.level),
  }));
}

export function transformMerchantList(raw: unknown): MerchantRow[] {
  return list(dataOf(raw)).map(row => ({
    id: String(row.id),
    name: str(row.name),
    status: num(row.state, num(row.status)),
    type: num(row.merchantType, num(row.type)),
    payload: jsonOf(row),
  }));
}

export function transformMerchantDetail(raw: unknown): MerchantRow {
  const data = record(dataOf(raw));
  const shopInfo = record(data.shopInfo);

  return {
    id: SEED_MERCHANT_ID,
    name: str(shopInfo.name, str(data.name)),
    status: num(data.state, num(data.status)),
    type: num(data.merchantType, num(data.type)),
    payload: jsonOf(data),
  };
}

/**
 * The login account is a fixed demo identity: the id from `account/get.json`
 * (160474295) must not leak into the seed.
 */
export function transformAccount(raw: unknown): AccountRow {
  const data = record(dataOf(raw));

  return {
    id: SEED_ACCOUNT_ID,
    merchantId: SEED_MERCHANT_ID,
    username: str(data.login, 'mt087320v'),
    name: '演示商家管理员',
    phone: '13412345678',
    interCode: '86',
    isOwner: true,
  };
}

export function transformLicenses(raw: unknown): MerchantLicenseRow[] {
  return list(dataOf(raw)).map(row => ({
    id: String(row.id),
    merchantId: SEED_MERCHANT_ID,
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
    merchantId: SEED_MERCHANT_ID,
    step: num(data.step, num(base.state)),
    status: num(audit.auditState, num(data.status)),
    payload: jsonOf(data),
  };
}

export function transformEntryTask(raw: unknown): EntryTaskRow {
  const data = record(dataOf(raw));
  const audit = record(data.audit);

  return {
    id: String(data.entryTaskId ?? data.id ?? ''),
    merchantId: SEED_MERCHANT_ID,
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
    payload: jsonOf(row),
  }));
}

/**
 * Coupon list rows only carry the list projection. Fill the detail columns with
 * derivations so a list row and a detail row share one table shape:
 * `rule = [price, discount]`, `stock = sendCount + leftCount`, `limit = 1`,
 * `putTerm = [stime, etime]`, and stable defaults for the remaining fields.
 */
export function transformCouponList(raw: unknown): CouponRow[] {
  return list(record(dataOf(raw)).list).map(row => {
    const stime = num(row.stime);
    const etime = num(row.etime);
    const price = num(row.price);
    const discount = num(row.discount);
    const sendCount = num(row.sendCount);
    const leftCount = num(row.leftCount);

    return {
      id: str(row.id),
      name: str(row.name),
      displayName: str(row.name),
      type: num(row.type),
      target: num(row.target),
      status: num(row.status),
      ctime: num(row.ctime),
      stime,
      etime,
      price,
      discount,
      validDays: num(row.validDays),
      validStime: num(row.validStime),
      validEtime: num(row.validEtime),
      sendCount,
      leftCount,
      stock: sendCount + leftCount,
      limit: 1,
      putCrowd: -1,
      useCrowd: -1,
      position: 0,
      ticketType: 0,
      rule: jsonOf([price, discount]),
      putTerm: jsonOf([stime, etime]),
      useTerm: jsonOf(row.useTerm ?? []),
      spuList: jsonOf([]),
      spuIds: jsonOf([]),
      wmPoiIds: jsonOf([]),
    };
  });
}

/** Detail rows win on every column they carry (notably `rule: [100, 10]`). */
export function transformCouponDetail(raw: unknown): CouponRow {
  const data = record(dataOf(raw));
  const rule = Array.isArray(data.rule) ? data.rule : [];
  const putTerm = Array.isArray(data.putTerm) ? data.putTerm : [];
  const price = num(rule[0]);
  const discount = num(rule[1]);
  const stime = num(putTerm[0]);
  const etime = num(putTerm[1]);
  const sendCount = num(data.sendCount);
  const leftCount = num(data.leftCount);

  return {
    id: str(data.id),
    name: str(data.name),
    displayName: str(data.displayName, str(data.name)),
    type: num(data.type),
    target: num(data.target),
    status: num(data.status),
    ctime: num(data.ctime),
    stime,
    etime,
    price,
    discount,
    validDays: num(data.validDays),
    validStime: num(data.validStime),
    validEtime: num(data.validEtime),
    sendCount,
    leftCount,
    stock: num(data.stock, sendCount + leftCount),
    limit: num(data.limit, 1),
    putCrowd: num(data.putCrowd),
    useCrowd: num(data.useCrowd),
    position: num(data.position),
    ticketType: num(data.ticketType),
    rule: jsonOf(rule),
    putTerm: jsonOf(putTerm),
    useTerm: jsonOf(data.useTerm ?? []),
    spuList: jsonOf(data.spuList ?? []),
    spuIds: jsonOf(data.spuIds ?? []),
    wmPoiIds: jsonOf(data.wmPoiIds ?? []),
  };
}

export function transformCampaigns(raw: unknown): CampaignRow[] {
  return list(record(dataOf(raw)).list).map(row => ({
    id: str(row.id),
    name: str(row.name),
    type: num(row.type),
    startTime: str(row.startTime),
    endTime: str(row.endTime),
    applyStartTime: str(row.applyStartTime),
    applyEndTime: str(row.applyEndTime),
    startTimeStr: str(row.startTimeStr),
    endTimeStr: str(row.endTimeStr),
    applyStartTimeStr: str(row.applyStartTimeStr),
    applyEndTimeStr: str(row.applyEndTimeStr),
    applyStatus: num(row.applyStatus),
    applySpuCount: nullableNum(row.applySpuCount),
    applySkuCount: nullableNum(row.applySkuCount),
    minStock: nullableStr(row.minStock),
    maxStock: nullableStr(row.maxStock),
    cover: nullableStr(row.cover),
    canClickApply: typeof row.canClickApply === 'boolean' ? row.canClickApply : null,
    payload: jsonOf(row),
  }));
}

export function transformLatestNews(raw: unknown): MessageRow[] {
  return list(dataOf(raw)).map(row => ({
    kind: 'news',
    id: str(row.id),
    title: str(row.title),
    type: num(row.type),
    content: null,
    createTime: null,
    publishTime: num(row.publishTime),
    duration: null,
    noticeStyle: null,
    notifyEnable: null,
    actionList: null,
    payload: jsonOf(row),
  }));
}

export function transformMessageDetail(raw: unknown): MessageRow[] {
  return list(dataOf(raw)).map(row => ({
    kind: 'detail',
    id: str(row.id),
    title: str(row.title),
    type: num(row.type),
    content: nullableStr(row.content),
    createTime: nullableNum(row.createTime),
    publishTime: nullableNum(row.publishTime),
    duration: nullableNum(row.duration),
    noticeStyle: nullableNum(row.noticeStyle),
    notifyEnable: typeof row.notifyEnable === 'boolean' ? row.notifyEnable : null,
    actionList: jsonOf(row.actionList ?? []),
    payload: jsonOf(row),
  }));
}

export function transformViolationOverview(raw: unknown): ViolationRow {
  const data = record(dataOf(raw));

  return {
    id: SEED_VIOLATION_ID,
    issueCount: num(data.issueCount),
    appealCount: num(data.appealCount),
    ticketAmount: num(data.ticketAmount),
    payload: jsonOf(data),
  };
}

export function transformProductSelling(raw: unknown): ProductRow {
  const data = record(dataOf(raw));

  return {
    id: SEED_PRODUCT_ID,
    poiId: '0',
    payload: jsonOf(data),
  };
}

export function transformGold(raw: unknown): { period: GoldPeriodRow; standards: GoldStandardRow[] } {
  const data = record(dataOf(raw));
  const period: GoldPeriodRow = {
    id: SEED_GOLD_PERIOD_ID,
    lastPeriodStatus: num(data.lastPeriodStatus),
    currentPeriodSTime: str(data.currentPeriodSTime),
    currentPeriodETime: str(data.currentPeriodETime),
    payload: jsonOf(data),
  };

  const standards = list(data.standards).map(row => ({
    key: str(row.key),
    periodId: SEED_GOLD_PERIOD_ID,
    name: str(row.name),
    desc: str(row.desc),
    progress: str(row.progress),
    url: str(row.url),
    qualified: num(row.qualified),
    payload: jsonOf(row),
  }));

  return { period, standards };
}

export function transformMerchantTasks(raw: unknown): MerchantTaskRow {
  const data = record(dataOf(raw));

  return {
    id: SEED_MERCHANT_TASK_ID,
    poiId: '0',
    curTaskCount: num(data.curTaskCount),
    curAwardCount: num(data.curAwardCount),
    payload: jsonOf(data),
  };
}

export function transformAnalysisSnapshot(raw: unknown, key: AnalysisKey, period: string): AnalysisSnapshotRow {
  return {
    key,
    period,
    payload: jsonOf(dataOf(raw)),
  };
}
