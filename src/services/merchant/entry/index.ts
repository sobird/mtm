/**
 * index.ts
 * 
 * sobird<i@sobird.me> at 2023/06/30 20:24:10 created.
 */

import http from "@/utils/http";

export interface IEntry {
  entryTaskId?: number;
  bizType?: number;
  localCommerce?: number;
  auditInfo?: {
    auditState: number;
    rejectReason: string[];
  };
  baseInfo?: {
    category: number | number[];
    poiType: number;
    name?: string;
    logo?: string;
    state?: number;
  };
  /**
   * 客户信息
   */
  customerInfo?: {
    // 公司类型
    companyType: number;
    // 销售渠道
    sellChannel: number[];
    certificateBankOpen: string;
    certificateTaxpayer: string;
    officeAddress: string;
    officePhoto: string[];
    companyDesc: {
      desc: string;
      fileList: string[];
    },
    businessLicenseInfo: {
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
    },
    /**
     * 法人信息
     */
    legalPersonInfo: object;
    enrichedPersonInfo: object;
    state: number;
  };

  manageInfo?: {
    goodsDesc: string[];
    goodsPriceScope: string[];
    peopleNumberYy: string;
    peopleNumberKf: string;
    peopleNumberCp: string;
    operateName: string;
    operatePhone: string;
    verificationCode: string;
    planSendCompanyList: string[];
    baseInfo: {
      poiType: number;
      category: number;
      name: string;
      logo: string;
      state: number;
    },
    managerPersonInfo: {
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
  basicInfo?: {
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
  customsRecordInfo?: {
    customsRecordList: string[];
    state: number;
  }
}

export default {
  get(entryTaskId?: number) {
    return http.get<IEntry>('/merchant/entry', {
      entryTaskId
    });
  },
  patch(data: IEntry) {
    return http.patch('/merchant/entry', data);
  }
}