/**
 * 商家信息
 * 
 * sobird<i@sobird.me> at 2023/06/20 21:54:57 created.
 */

/**
 * 店铺信息
 */
export interface IShopInfo {
  name?: string;
  desc?: string;
  bankNum?: string;
  bankUname?: string;
  bankMode?: 1 | 2; // 1对公 2 对私
  logo?: string;
  bankPhone?: string;
  address?: string;
  branchId?: number;
  bankId?: number;
  branchName?: string;
  cityId?: number;
  provinceId?: number;
  returnAddress?: string;
  eMerchantId?: string;
  eSupplierId?: string;
  defaultAddressList?: {
    receiverName?: string;
    address?: string;
    phone?: string;
  };
  walletId?: string; // 钱包ID
  id?: number;
}

export interface IMerchantWallet {
  /**
   * 钱包id
   */
  walletId: string;
  /**
   * 钱包类型：1:对公（企业钱包） 2：对私（个人钱包）说明：这个信息是在咱们这边存储的，不是在钱包侧存储的
   */
  walletType: number;
  /**
   * 钱包主体（个人：张某某，企业：XXX有限公司）
   */
  walletName: string;
  /**
   * 钱包账号
   */
  walletAccount: string;
  /**
   * 绑定手机号
   */
  bindingPhone?: string;
  /**
   * 是否当前使用钱包
   */
  currentWallet?: boolean;
  /**
   * 余额
   */
  remainAmount?: number;
  /**
   * 账户类型：101 现金户 102 保证金户 104 电商代付户 106 在途资金户 110 退款失败专用户
   */
  accountType?: number;
  /**
   * 绑定的银行卡数量
   */
  bankCardCount?: number;
  /**
   * 是否展示更换钱包按钮
   */
  changeWallet?: boolean;
}

export interface IWalletData {
  merchantWalletList?: Partial<IMerchantWallet[]>;
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

export interface IMerchantDetail {
  /**
   * 法人信息
   */
  legalPersonInfo: {
    idCardPhotos?: string[];
    phone?: string;
    name?: string;
    cardNum?: string;
    /**
     * 卡号有效期类型 1 长期有效 2 短期有效
     */
    cardValidateType?: 1 | 2;
    validate?: string;
    /**
     * 证件类型
     */
    cardType?: number;
  };
  merchantManagerInfo: {
    idCardPhotos?: string[];
    phone?: string;
    name?: string;
    cardNum?: string;
    cardValidateType?: 1 | 2;
    validate?: string;
    decodePhone?: string;
  };
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
  shopInfo: IShopInfo;
  contactConfirm?: number | boolean; // 签署合同
  margin?: boolean;
  settlement?: boolean;
  /**
   * 审核状态 1 未审核 2 审核通过 3 审核拒绝
   */
  reviewState?: 1 | 2 | 3;
  /**
   * 钱袋宝开户状态 1 未开户 2 开户失败 3 已开户
   */
  incomingState?: 1 | 2 | 3;
  /**
   * 商家状态 1 未入驻 2 未开户 3 未审核 4 未缴纳保证金 5 运行中 6 下线 7 未签署合同
   */
  merchantState?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  pcContactLink?: string;
  h5ContactLink?: string;
  bsid?: string; // token
  groupInfo?: {
    groupNumber?: number;
    groupTime?: string;
  };
  contactInfo: {
    qrCodeUrl?: string;
    /**
     * 1-招商企业微信二维码 2-运营企业微信二维码
     */
    type?: 1 | 2;
  };
  /**
   * 店铺类型 10,个人店; 20,普通店; 21,专营店; 22,专卖店; 23,旗舰店; 99,其他
   */
  merchantType?: number | string;
  /**
   * 店铺经营许可
   */
  licenseList?: ILicense[];
  /**
   * 管理人员和法人信息是否一致
   */
  legalPersonManagerSame?: boolean;
  /**
   * 店铺详情页选中了哪个tab
   */
  activityTab?: string;
  /**
   * 上传logo，添加证照，添加资质审核按钮是否展示
   */
  showButtonConfig?: boolean;
  /**
   * 新的用来判断合约是否签署的字段
   */
  contractState?: boolean;
  /**
   * 钱包信息
   */
  walletData?: IWalletData;
  /**
   * 是否为主账号
   */
  loginAccountIsMaster?: boolean;
  /**
   * 是否退店
   */
  exited?: boolean;
  imInfo: {
    /**
     * 当前是否为离线账号，未开启分流商家始终为false
     */
    isOfflineAccount: boolean;
    /**
     * 正在批量转移会话中，未开启分流商家始终为false
     */
    isBatchTransfering: boolean;
    /**
     * 智能机器人，1-开启，2-关闭，3-未开启过
     */
    smartRobotStatus: number;
    /**
     * 智能客服自定义知识库初次启用生效时间
     */
    smartRobotEffectiveTime: string;
  };
}

/**
 * 运营商虚拟电话
 */
export interface IOperatorVirtualPhone {
  virtualNumber: string;
  operatorName: string;
  effectiveTime: string;
}