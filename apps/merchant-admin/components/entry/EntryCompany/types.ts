export interface MerchantOptionItem {
  type: number;
  name: string;
  [key: string]: unknown;
}

export interface MerchantOptions {
  companyTypeList?: MerchantOptionItem[];
  distChannelList?: MerchantOptionItem[];
  [key: string]: unknown;
}

export interface EntryCompanyDetail {
  entryTaskId?: string;
  bizType?: number;
  audit?: { auditState?: number; [key: string]: unknown };
  company?: Record<string, unknown>;
  [key: string]: unknown;
}
