import type { Translate } from '@mtm/i18n';
import { z } from 'zod';

import { isMobilePhone } from './phone';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 店铺基本信息表单。 */
export function createBaseInfoSchema(t: Translate) {
  return z.object({
    description: z.string().max(200, t('validation.profileDescriptionMax')),
    externalLink: z.string().max(1000, t('validation.profileExternalLinkMax')),
  });
}

export type BaseInfoValues = z.output<ReturnType<typeof createBaseInfoSchema>>;

/** 联系方式表单。 */
export function createContactSchema(t: Translate) {
  return z.object({
    managerEmail: z.string().regex(EMAIL_PATTERN, t('validation.profileEmailInvalid')),
    servicePhoneNum: z.string().max(30, t('validation.profileServicePhoneMax')),
    emergencyContact: z.string().regex(/^[\u4E00-\u9FFF·]{2,60}$/, t('validation.profileContactNameInvalid')),
    emergencyContactPhone: z.string().refine(value => isMobilePhone(value, '86'), t('validation.chinaMobileInvalid')),
    captcha: z.string().regex(/^\d{6}$/, t('validation.profileCaptchaInvalid')),
  });
}

export type ContactValues = z.output<ReturnType<typeof createContactSchema>>;

/** 变更为个人钱包前置认证表单。 */
export function createWalletAuthSchema(t: Translate) {
  return z.object({
    companyName: z.string().min(1, t('validation.companyNameRequired')).max(60, t('validation.profileCompanyNameMax')),
    companyIdCard: z.string().regex(/^[0-9A-Za-z]{15,20}$/, t('validation.profileCompanyIdCardInvalid')),
    phone: z.string().refine(value => isMobilePhone(value, '86'), t('validation.chinaMobileInvalid')),
    captcha: z.string().regex(/^\d{6}$/, t('validation.profileCaptchaInvalid')),
  });
}

export type WalletAuthValues = z.output<ReturnType<typeof createWalletAuthSchema>>;
