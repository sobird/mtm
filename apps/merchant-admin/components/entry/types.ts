export interface MerchantCategoryItem {
  id: string;
  parentId: string;
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
  id: string;
  entryTaskId: string;
  merchantId: string;
  bizType: number;
  localCommerce: number;
  status: number;
  [key: string]: unknown;
}

export interface EntryDetail {
  entryTaskId: string;
  base: EntryBase;
  [key: string]: unknown;
}
