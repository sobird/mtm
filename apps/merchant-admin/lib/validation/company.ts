import type { Translate } from '@mtm/i18n';
import { z } from 'zod';

import { isMobilePhone } from './phone';

/** `[long-term valid, start date, end date]`; long-term checked or at least one date present. */
export function isTermValid(term: unknown): boolean {
  if (!Array.isArray(term)) {
    return false;
  }

  return Boolean(term[0]) || term.slice(1).some(Boolean);
}

export function createBusinessLicenseSchema(t: Translate) {
  const termSchema = z.array(z.unknown()).refine(isTermValid, t('validation.termRequired'));

  return z
    .object({
      url: z.string().min(1, t('validation.companyLicenseRequired')),
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
        ctx.addIssue({ code: 'custom', path: ['socialCreditCode'], message: t('validation.socialCreditCodeRequired') });
      }
      if (!value.name) {
        ctx.addIssue({ code: 'custom', path: ['name'], message: t('validation.companyNameRequired') });
      }
      if (!value.address) {
        ctx.addIssue({ code: 'custom', path: ['address'], message: t('validation.addressRequired') });
      }
      if (!isTermValid(value.term)) {
        ctx.addIssue({ code: 'custom', path: ['term'], message: t('validation.businessTermRequired') });
      }
      if (!value.capital) {
        ctx.addIssue({ code: 'custom', path: ['capital'], message: t('validation.capitalRequired') });
      }
    });
}

export function createLegalPersonSchema(t: Translate) {
  const termSchema = z.array(z.unknown()).refine(isTermValid, t('validation.termRequired'));

  return z.object({
    idType: z.coerce.number().optional(),
    name: z.string().min(1, t('validation.legalPersonNameRequired')),
    idNum: z.string().min(1, t('validation.idNumberRequired')),
    term: termSchema,
    mobile: z.string().refine(value => isMobilePhone(value, '86'), t('validation.chinaMobileInvalid')),
    idPhotos: z.array(z.string()).min(1, t('validation.idPhotosRequired')),
  });
}

export function createCompanyInfoSchema(t: Translate) {
  return z.object({
    companyType: z.coerce.number().min(1, t('validation.companyTypeRequired')),
    distChannel: z.array(z.coerce.number()).optional(),
    businessLicense: createBusinessLicenseSchema(t),
    certificateTaxpayer: z.array(z.string()).optional(),
    certificateBankOpen: z.array(z.string()).min(1, t('validation.bankOpenRequired')),
    officeAddress: z.string().min(1, t('validation.officeAddressRequired')),
    companyDesc: z.string().min(1, t('validation.companyDescRequired')).max(1000, t('validation.companyDescMax')),
    companyFile: z.array(z.string()).optional(),
    legalPerson: createLegalPersonSchema(t),
  });
}

export function createCompanySchema(t: Translate) {
  return z.object({
    company: createCompanyInfoSchema(t),
  });
}

export type CompanyFormValues = z.infer<ReturnType<typeof createCompanySchema>>;
export type CompanyInfoValues = z.infer<ReturnType<typeof createCompanyInfoSchema>>;
