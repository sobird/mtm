import { z } from 'zod';

import { isMobilePhone } from './phone';

/** `[长期有效, 开始日期, 结束日期]`; long-term checked or at least one date present. */
export function isTermValid(term: unknown): boolean {
  if (!Array.isArray(term)) {
    return false;
  }

  return Boolean(term[0]) || term.slice(1).some(Boolean);
}

const termSchema = z.array(z.unknown()).refine(isTermValid, '请选择有效截止日期');

export const businessLicenseSchema = z
  .object({
    url: z.string().min(1, '营业执照不能为空'),
    socialCreditCode: z.string().optional(),
    name: z.string().optional(),
    address: z.string().optional(),
    term: termSchema.optional(),
    capital: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.url) {
      return;
    }
    if (!value.socialCreditCode) {
      ctx.addIssue({ code: 'custom', path: ['socialCreditCode'], message: '统一社会信用代码不能为空' });
    }
    if (!value.name) {
      ctx.addIssue({ code: 'custom', path: ['name'], message: '公司名称不能为空' });
    }
    if (!value.address) {
      ctx.addIssue({ code: 'custom', path: ['address'], message: '经营地址不能为空' });
    }
    if (!isTermValid(value.term)) {
      ctx.addIssue({ code: 'custom', path: ['term'], message: '营业期限不能为空' });
    }
    if (!value.capital) {
      ctx.addIssue({ code: 'custom', path: ['capital'], message: '注册资金不能为空' });
    }
  });

export const legalPersonSchema = z.object({
  idType: z.coerce.number().optional(),
  name: z.string().min(1, '法人姓名不能为空'),
  idNum: z.string().min(1, '证件号码不能为空'),
  term: termSchema,
  mobile: z.string().refine(value => isMobilePhone(value, '86'), '请输入正确的中国大陆11位手机号码'),
  idPhotos: z.array(z.string()).optional(),
});

export const companyInfoSchema = z.object({
  companyType: z.coerce.number().min(1, '公司类型不能为空'),
  distChannel: z.array(z.coerce.number()).optional(),
  businessLicense: businessLicenseSchema,
  certificateTaxpayer: z.array(z.string()).optional(),
  certificateBankOpen: z.array(z.string()).min(1, '银行开户证明不能为空'),
  officeAddress: z.string().min(1, '办公地址不能为空'),
  companyDesc: z.string().min(1, '公司简介不能为空').max(1000, '公司简介最多1000字'),
  companyFile: z.array(z.string()).optional(),
  legalPerson: legalPersonSchema,
});

export const companySchema = z.object({
  company: companyInfoSchema,
});

export type CompanyFormValues = z.infer<typeof companySchema>;
export type CompanyInfoValues = z.infer<typeof companyInfoSchema>;
