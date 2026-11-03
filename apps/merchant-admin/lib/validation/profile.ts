import { z } from 'zod';

import { isMobilePhone } from './phone';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 店铺基本信息表单。 */
export const baseInfoSchema = z.object({
  description: z.string().max(200, '店铺简介最多200个字符'),
  externalLink: z.string().max(1000, '第三方平台链接最多1000个字符'),
});

export type BaseInfoValues = z.infer<typeof baseInfoSchema>;

/** 联系方式表单。 */
export const contactSchema = z.object({
  managerEmail: z.string().regex(EMAIL_PATTERN, '邮箱格式不合法'),
  servicePhoneNum: z.string().max(30, '客服电话最多30个字符'),
  emergencyContact: z.string().regex(/^[\u4E00-\u9FFF·]{2,60}$/, '请输入正确的中国人名'),
  emergencyContactPhone: z.string().refine(value => isMobilePhone(value, '86'), '请输入正确的中国大陆11位手机号码'),
  captcha: z.string().regex(/^\d{6}$/, '手机验证码不正确，请重新输入'),
});

export type ContactValues = z.infer<typeof contactSchema>;

/** 变更为个人钱包前置认证表单。 */
export const walletAuthSchema = z.object({
  companyName: z.string().min(1, '企业名称不能为空').max(60, '企业名称最多60个字符'),
  companyIdCard: z.string().regex(/^[0-9A-Za-z]{15,20}$/, '请输入正确的企业证件号（统一社会信用代码）'),
  phone: z.string().refine(value => isMobilePhone(value, '86'), '请输入正确的中国大陆11位手机号码'),
  captcha: z.string().regex(/^\d{6}$/, '手机验证码不正确，请重新输入'),
});

export type WalletAuthValues = z.infer<typeof walletAuthSchema>;
