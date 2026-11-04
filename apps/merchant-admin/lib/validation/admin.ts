import type { Translate } from '@mtm/i18n';
import { z } from 'zod';

import { isIdentityCard } from './id-card';
import { isMobilePhone } from './phone';

/** `[长期有效, 开始日期, 结束日期]`; long-term checked or a date present. */
export function isTermValue(value: unknown): boolean {
  if (!Array.isArray(value)) {
    return false;
  }

  return Boolean(value[0]) || value.slice(1).some(Boolean);
}

/**
 * Shop-admin form validation, ported from the legacy Antd rules in
 * `src/pages/shop/admin/components/admin-form`.
 */
export function createAdminSchema(t: Translate) {
  const termSchema = z.array(z.unknown()).refine(isTermValue, t('validation.termRequired'));

  return z.object({
    idCardPhotos: z.array(z.string()).superRefine((value, ctx) => {
      if (!value?.[0] && !value?.[1]) {
        ctx.addIssue({ code: 'custom', message: t('validation.idCardPhotosRequired') });
        return;
      }
      if (!value[0]) {
        ctx.addIssue({ code: 'custom', message: t('validation.idCardFrontRequired') });
      }
      if (!value[1]) {
        ctx.addIssue({ code: 'custom', message: t('validation.idCardBackRequired') });
      }
    }),
    name: z.string().min(1, t('validation.adminNameRequired')).max(30, t('validation.adminNameMax')),
    citizenId: z.string().refine(isIdentityCard, t('validation.citizenIdInvalid')),
    validdate: termSchema,
    mobile: z.string().refine(value => isMobilePhone(value, '86'), t('validation.chinaMobileInvalid')),
    captcha: z.string().regex(/^\d{6}$/, t('validation.profileCaptchaInvalid')),
    authLetter: z.array(z.string()).min(1, t('validation.authLetterRequired')),
  });
}
