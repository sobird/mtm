/**
 * enum.ts
 * 
 * sobird<i@sobird.me> at 2023/07/01 21:09:31 created.
 */

import http from "@/utils/http";


interface IOption {
  type: number;
  name: string;
  setType: boolean;
  setName: boolean;
}

export interface IEntryEnum {
  companyTypeList: IOption[];
  sellChannelList: IOption[];
  authLevelList: IOption[];
  externalUrlList: IOption[];
  goodsPriceScopeList: IOption[];
  operateModeList: IOption[];
  operateScopeList: IOption[];
  planSendCompanyList: IOption[];
  poiBrandTypeList: IOption[];
  poiTypeList: IOption[];
  sendGoodsModeList: IOption[];
  trademarkRegistrantTypeList: IOption[];
  warehouseAreaList: IOption[];
  warehouseModeList: IOption[];
  warehouseNumberList: IOption[];
  bondedWarehouseList: IOption[];
  registerAreaList: IOption[];
  factoryPersonScaleList: IOption[];
  warehouseManageList: IOption[];

  companyTypeListIterator: IOption[];
  sellChannelListIterator: IOption[];
  authLevelListIterator: IOption[];
  externalUrlListIterator: IOption[];
  goodsPriceScopeListIterator: IOption[];
  operateModeListIterator: IOption[];
  operateScopeListIterator: IOption[];
  planSendCompanyListIterator: IOption[];
  poiBrandTypeListIterator: IOption[];
  poiTypeListIterator: IOption[];
  sendGoodsModeListIterator: IOption[];
  trademarkRegistrantTypeListIterator: IOption[];
  warehouseAreaListIterator: IOption[];
  warehouseModeListIterator: IOption[];
  warehouseNumberListIterator: IOption[];
  bondedWarehouseListIterator: IOption[];
  registerAreaListIterator: IOption[];
  factoryPersonScaleListIterator: IOption[];
  warehouseManageListIterator: IOption[];

  companyTypeListSize: number;
  sellChannelListSize: number;
  authLevelListSize: number;
  externalUrlListSize: number;
  goodsPriceScopeListSize: number;
  operateModeListSize: number;
  operateScopeListSize: number;
  planSendCompanyListSize: number;
  poiBrandTypeListSize: number;
  poiTypeListSize: number;
  sendGoodsModeListSize: number;
  trademarkRegistrantTypeListSize: number;
  warehouseAreaListSize: number;
  warehouseModeListSize: number;
  warehouseNumberListSize: number;
  bondedWarehouseListSize: number;
  registerAreaListSize: number;
  factoryPersonScaleListSize: number;
  warehouseManageListSize: number;

  setCompanyTypeList: boolean;
  setSellChannelList: boolean;
  setAuthLevelList: boolean;
  setExternalUrlList: boolean;
  setGoodsPriceScopeList: boolean;
  setOperateModeList: boolean;
  setOperateScopeList: boolean;
  setPlanSendCompanyList: boolean;
  setPoiBrandTypeList: boolean;
  setPoiTypeList: boolean;
  setSendGoodsModeList: boolean;
  setTrademarkRegistrantTypeList: boolean;
  setWarehouseAreaList: boolean;
  setWarehouseModeList: boolean;
  setWarehouseNumberList: boolean;
  setBondedWarehouseList: boolean;
  setRegisterAreaList: boolean;
  setFactoryPersonScaleList: boolean;
  setWarehouseManageList: boolean;
}

const EntryEnumService = {
  get(entryTaskId?: number) {
    return http.get<IEntryEnum>('/merchant/entry/enum', { entryTaskId });
  }
}

export default EntryEnumService;