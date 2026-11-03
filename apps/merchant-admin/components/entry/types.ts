export interface MerchantCategoryItem {
  id: number;
  parentId: number;
  name: string;
  level: number;
}

export interface EntryTypeItem {
  poiType: number;
  poiTypeName: string;
  poiTypeDesc: string;
  state: number;
}

export interface EntryBase {
  poiType: number;
  category: number;
  name: string;
  logo: string;
  state: number;
  [key: string]: unknown;
}

export interface EntryTaskItem {
  id: number;
  entryTaskId: number;
  merchantId: number;
  bizType: number;
  localCommerce: number;
  status: number;
  [key: string]: unknown;
}

export interface EntryDetail {
  entryTaskId: number;
  base: EntryBase;
  [key: string]: unknown;
}
