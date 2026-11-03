import type { Prisma } from '@/lib/generated/prisma';

/**
 * Plain row shapes mirroring the Prisma create inputs. Transformers produce
 * these from the mock JSON; seed modules pass them straight to `createMany`.
 */
export type JsonValue = Prisma.InputJsonValue;

export type AnalysisKey = 'workbench' | 'trending' | 'operation';

export interface MenuItemRow {
  id: string;
  parentId: string;
  title: string;
  icon: string;
  url: string;
  code: string;
  auth: boolean;
  index: string;
  level: number;
  sortId: number;
  toolMenu: boolean;
}

export interface MenuBadgeRow {
  menuId: string;
  actionType: number;
  noticeStyle: number;
  noticeContent: string;
}

export interface MenuFavoriteRow {
  accountId: string;
  menuId: string;
  sortIndex: number;
}

export interface MerchantCategoryRow {
  id: string;
  parentId: string;
  name: string;
  level: number;
}

export interface MerchantRow {
  id: string;
  name: string;
  status: number;
  type: number;
  payload: JsonValue;
}

export interface AccountRow {
  id: string;
  merchantId: string;
  username: string;
  name: string;
  phone: string;
  interCode: string;
  isOwner: boolean;
}

export interface MerchantLicenseRow {
  id: string;
  merchantId: string;
  type: number;
  name: string;
  url: string;
  status: number;
  expireAt: string;
}

export interface MerchantEntryRow {
  merchantId: string;
  step: number;
  status: number;
  payload: JsonValue;
}

export interface EntryTaskRow {
  id: string;
  merchantId: string;
  bizType: number;
  localCommerce: number;
  status: number;
}

export interface EntryTypeRow {
  code: string;
  name: string;
  templateUrl: string | null;
  payload: JsonValue;
}

export interface CouponRow {
  id: string;
  name: string;
  displayName: string;
  type: number;
  target: number;
  status: number;
  ctime: number;
  stime: number;
  etime: number;
  price: number;
  discount: number;
  validDays: number;
  validStime: number;
  validEtime: number;
  sendCount: number;
  leftCount: number;
  stock: number;
  limit: number;
  putCrowd: number;
  useCrowd: number;
  position: number;
  ticketType: number;
  rule: JsonValue;
  putTerm: JsonValue;
  useTerm: JsonValue;
  spuList: JsonValue;
  spuIds: JsonValue;
  wmPoiIds: JsonValue;
}

export interface CampaignRow {
  id: string;
  name: string;
  type: number;
  startTime: string;
  endTime: string;
  applyStartTime: string;
  applyEndTime: string;
  startTimeStr: string;
  endTimeStr: string;
  applyStartTimeStr: string;
  applyEndTimeStr: string;
  applyStatus: number;
  applySpuCount: number | null;
  applySkuCount: number | null;
  minStock: string | null;
  maxStock: string | null;
  cover: string | null;
  canClickApply: boolean | null;
  payload: JsonValue;
}

export interface MessageRow {
  kind: string;
  id: string;
  title: string;
  type: number;
  content: string | null;
  createTime: number | null;
  publishTime: number | null;
  duration: number | null;
  noticeStyle: number | null;
  notifyEnable: boolean | null;
  actionList: JsonValue | null;
  payload: JsonValue;
}

export interface ViolationRow {
  id: string;
  issueCount: number;
  appealCount: number;
  ticketAmount: number;
  payload: JsonValue;
}

export interface ProductRow {
  id: string;
  poiId: string;
  payload: JsonValue;
}

export interface GoldPeriodRow {
  id: string;
  lastPeriodStatus: number;
  currentPeriodSTime: string;
  currentPeriodETime: string;
  payload: JsonValue;
}

export interface GoldStandardRow {
  key: string;
  periodId: string;
  name: string;
  desc: string;
  progress: string;
  url: string;
  qualified: number;
  payload: JsonValue;
}

export interface MerchantTaskRow {
  id: string;
  poiId: string;
  curTaskCount: number;
  curAwardCount: number;
  payload: JsonValue;
}

export interface AnalysisSnapshotRow {
  key: AnalysisKey;
  period: string;
  payload: JsonValue;
}
