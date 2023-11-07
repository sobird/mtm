/**
 * 商家信息
 * 
 * sobird<i@sobird.me> at 2023/06/20 21:54:57 created.
 */

/** 店铺类型 值枚举：企业店，个人店 */
export enum MerchantTypeEnum {
  个人普通店铺 = 10,
  企业普通店铺 = 20,
  企业专营店铺 = 21,
  企业专卖店铺 = 22,
  企业旗舰店铺 = 23,
  /** 这个是虚拟的，后端没有维护这个变量 */
  其他 = 99
}

/** 商家主营类目 */
export interface IMerchantCategory {
  id: number;
  parentId: number;
  name: string;
  level: number;
  leaf: number;
  [key: string]: any;
}

/**
 * 店铺信息
 */
export interface IShopEntity {
  id?: number;
  /** 店铺名称 */
  name?: string;
  /** 店铺描述 */
  description?: string;
  /** 店铺Logo */
  logo?: string;
  /** 店铺类型 */
  type: number;
  /** 主营类目 */
  category: number;
  /** 钱包ID */
  walletId?: string;
  bankId?: number;
  bankNum?: string;
  bankUname?: string;
  bankMode?: 1 | 2; // 1对公 2 对私
  bankPhone?: string;
  address?: string;
  branchId?: number;
  branchName?: string;
  provinceId?: number;
  cityId?: number;
  returnAddress?: string;
  eMerchantId?: string;
  eSupplierId?: string;
  defaultAddressList?: {
    receiverName?: string;
    address?: string;
    phone?: string;
  };
  externalLink?: string;
}

export interface IWalletEntity {
  /** 钱包id */
  walletId: string;
  /** 钱包类型：1:对公（企业钱包） 2：对私（个人钱包）说明：这个信息是在咱们这边存储的，不是在钱包侧存储的 */
  walletType: number;
  /** 钱包主体（个人：张某某，企业：XXX有限公司） */
  walletName: string;
  /** 钱包账号 */
  walletAccount: string;
  /** 绑定的手机号 */
  bindingPhone?: string;
  /** 余额 */
  remainAmount?: number;
  /** 账户类型：101 现金户 102 保证金户 104 电商代付户 106 在途资金户 110 退款失败专用户 */
  accountType?: 101 | 102 | 104 | 106 | 110;
  /** 绑定的银行卡数量 */
  bankCardCount?: number;
  /** 是否当前使用钱包 */
  currentWallet?: boolean;
  /** 是否展示更换钱包按钮 */
  changeWallet?: boolean;
}

export interface IWalletData {
  merchantWalletList?: Partial<IWalletEntity>[];
  account?: string;
  phoneMask?: string;
  phone?: string;
}

export interface ILicense {
  /**
   * 许可证id
   */
  id?: number;
  /**
   * 商家id
   */
  merchantId?: number;
  /**
   * 许可证类型编码
   */
  licenseType?: number;
  /**
   * 许可证类型编码
   */
  licenseTypeStr?: string;
  /**
   * 地址URL http://p0.meituan.net/credentials/f89b34439df080736a88387b4d588b2d321279.png
   */
  license?: string;
  /**
   * 有效截止日期 2020-12-12
   */
  validDeadline?: string;
  /**
   * 创建时间 2020-12-12 12:12:12
   */
  createTime?: string;
  /**
   * 审核状态 4-审核中 6-审核通过 5-审核驳回
   */
  auditState?: number;
  /**
   * 证件是否过期 true-过期 false-不过期
   */
  isOverdue?: boolean;
  /**
   * 驳回原因
   */
  rejectReason?: string;
}

export interface IMerchantEntity {
  /** 法人信息 */
  legalPersonInfo: {
    name?: string;
    phone?: string;
    /** 证件类型 */
    cardType?: number;
    cardNum?: string;
    idCardPhotos?: string[];
    /** 卡号有效期类型 1 长期有效 2 短期有效 */
    cardValidateType?: 1 | 2;
    /** 卡号有效期 */
    validate?: string;
    email?: string;
  };
  /** 管理员信息 */
  merchantManagerInfo: {
    idCardPhotos?: string[];
    phone?: string;
    name?: string;
    cardNum?: string;
    cardValidateType?: 1 | 2;
    validate?: string;
    decodePhone?: string;
    email?: string
  };
  /** 公司信息 */
  enteredCompanyInfo: {
    mainCategory?: number[];
    businessLicense?: string;
    name?: string;
    socialCreditCode?: string;
    address?: string;
    openingPermit?: string;
    type?: string;
    registeredCapital?: string;
    foundedDate?: string;
    files?: string[];
    operatingTimeType?: 1 | 2;
    operatingTime?: string;
    operatingAddress?: string;
    operatingRange?: string;
  };
  shopInfo: IShopEntity;
  /** 签署合同 */
  contactConfirm?: number | boolean;
  margin?: boolean;
  settlement?: boolean;
  /** 审核状态 1 未审核 2 审核通过 3 审核拒绝 */
  reviewState?: 1 | 2 | 3;
  /** 钱袋宝开户状态 1 未开户 2 开户失败 3 已开户 */
  incomingState?: 1 | 2 | 3;
  /** 商家状态 1 未入驻 2 未开户 3 未审核 4 未缴纳保证金 5 运行中 6 下线 7 未签署合同 */
  merchantState?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  pcContactLink?: string;
  h5ContactLink?: string;
  /** token */
  bsid?: string;
  groupInfo?: {
    groupNumber?: number;
    groupTime?: string;
  };
  contactInfo: {
    qrCodeUrl?: string;
    /** 1-招商企业微信二维码 2-运营企业微信二维码 */
    type?: 1 | 2;
  };
  /** 店铺类型 10,个人店; 20,普通店; 21,专营店; 22,专卖店; 23,旗舰店; 99,其他 */
  merchantType?: number;
  /** 店铺经营许可 */
  licenseList?: ILicense[];
  /** 管理人员和法人信息是否一致 */
  legalPersonManagerSame?: boolean;
  /** 店铺详情页选中了哪个tab */
  activityTab?: string;
  /** 上传logo，添加证照，添加资质审核按钮是否展示 */
  showButtonConfig?: boolean;
  /** 新的用来判断合约是否签署的字段 */
  contractState?: boolean;
  /** 钱包信息 */
  walletData?: IWalletData;
  /** 是否为主账号 */
  loginAccountIsMaster?: boolean;
  /** 是否退店 */
  exited?: boolean;
  imInfo: {
    /** 当前是否为离线账号，未开启分流商家始终为false */
    isOfflineAccount?: boolean;
    /** 正在批量转移会话中，未开启分流商家始终为false */
    isBatchTransfering?: boolean;
    /** 智能机器人，1-开启，2-关闭，3-未开启过 */
    smartRobotStatus?: number;
    /** 智能客服自定义知识库初次启用生效时间 */
    smartRobotEffectiveTime?: string;
    /** 是否开启IM分流 */
    imSeparateOnShadow?: boolean;
  };
}

/** 运营商虚拟电话 */
export interface IOperatorVirtualPhone {
  virtualNumber: string;
  operatorName: string;
  effectiveTime: string;
}

/** 商家合同签约请求参数 */
export interface IMerchantSignContractRequest {
  captcha: number;
  policy: boolean;
}

/** 商家入住基本信息 */
export interface IMerchantEntryEntity {
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

type IOption = {
  [key in string]: any;
  value: number | string;
  name: string;
}

export interface IMerchantOptions {
  companyTypeList: IOption[];
  distChannelList: IOption[];
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
}

/** 商家类型 */
export interface IMerchantType {
  poiType: number;
  poiTypeName: string;
  poiTypeDesc: string;
  state: number;
}

export interface IMerchantTask {
  entryTaskId: number;
  bizType: number;
  localCommerce: number;
}

/** 钱包类型，1-企业钱包  2-个人钱包 */
export enum WalletTypeEnum {
  "企业钱包" = 1,
  "个人钱包" = 2,
}