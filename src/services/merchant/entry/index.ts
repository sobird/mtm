/**
 * EntryService
 * 
 * sobird<i@sobird.me> at 2023/06/30 20:24:10 created.
 */

import http from "@/utils/http";

export interface IEntryService {
  entryTaskId?: number;
  bizType?: number;
  localCommerce?: number;
  audit?: {
    auditState: number;
    rejectReason: string[];
  };
  base?: {
    category: number | number[];
    poiType: number;
    name?: string;
    logo?: string;
    state?: number;
  };
  /**
   * 客户信息
   */
  company?: {
    // 公司类型
    companyType: number;
    // 销售渠道
    distChannel: number[];
    certificateBankOpen: string;
    certificateTaxpayer: string;
    officeAddress: string;
    officePhoto: string[];
    companyDesc: string;
    companyFile: string[]
    businessLicense: {
      businessLicense: string;
      socialCreditCode: string;
      name: string;
      address: string;
      operatingTimeBegin: string;
      operatingTimeEnd: string;
      operatingTimeType: number;
      legalPersonName: string;
      type: string;
      operatingRange: string;
      registeredCapital: string;
      foundedDate: string;
      registerAreaId: number;
      registerAreaName: string;
    };
    /**
     * 法人信息
     */
    legalPerson: object;
    enrichedPerson: object;
    state: number;
  }
  manage?: {
    goodsDesc: string[];
    goodsPriceScope: string[];
    peopleNumberYy: string;
    peopleNumberKf: string;
    peopleNumberCp: string;
    operateName: string;
    operatePhone: string;
    verificationCode: string;
    planSendCompanyList: string[];
    base: {
      poiType: number;
      category: number;
      name: string;
      logo: string;
      state: number;
    },
    person: {
      isSameLegalPerson: number;
      cardType: number;
      idCardPhotos: string[];
      name: string;
      cardNum: string;
      validateDateEnd: string;
      cardValidateType: number;
      phone: string;
      verificationCode: string;
      authLetter: string;
      address: string;
    },
    state: number;
    sameCityService: number;
  };
  basic?: {
    productionAvgDay: object;
    productionUnit: object;
    productionLinePhoto: string[];
    warehouseMode: number;
    warehouseNumber: number;
    warehouseArea: number;
    warehouseAddress: string;
    warehousePhoto: string[];
    operateMode: number;
    operateScope: number;
    salesOnline: object;
    salesAll: object;
    sendGoodsMode: number;
    sendGoodsAvgDay: object;
    sendGoodsCertificate: string[];
    alreadyExistPlatform: string[];
    state: number;
    peopleNumberGc: object;
    warehouseManage: object;
    sendGoodsAvgDayTotal: object;
  };
  qualificationAndBrand?: object;
  customsRecord?: {
    customsRecordList: string[];
    state: number;
  }
}

export default {
  get(entryTaskId?: number) {
    return http.get<IEntryService>('/merchant/entry', {
      entryTaskId
    });
  },
  patch(data: IEntryService) {
    return http.patch('/merchant/entry', data);
  }
}