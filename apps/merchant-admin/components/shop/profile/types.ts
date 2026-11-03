/** Narrow shapes for the nested payload returned by `/api/merchant/detail`. */

export interface MerchantPersonInfo {
  name?: string;
  phone?: string;
  cardNum?: string;
  validate?: string;
  cardValidateType?: number;
  email?: string;
  idCardPhotos?: string[] | null;
}

export interface MerchantCompanyInfo {
  name?: string;
  businessLicense?: string;
  socialCreditCode?: string;
  address?: string;
  operatingAddress?: string;
  type?: string;
  registeredCapital?: string;
  operatingTime?: string;
}

export interface MerchantShopInfo {
  id?: number;
  name?: string;
  description?: string;
  type?: number;
  category?: number;
  logo?: string;
  externalLink?: string;
  servicePhoneNum?: string;
  walletId?: string;
}

export interface MerchantProfileDTO {
  id: number;
  legalPersonInfo?: MerchantPersonInfo;
  merchantManagerInfo?: MerchantPersonInfo;
  enteredCompanyInfo?: MerchantCompanyInfo;
  shopInfo?: MerchantShopInfo;
}
