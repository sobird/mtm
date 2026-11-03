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

const termSchema = z.array(z.unknown()).refine(isTermValue, '身份证件有效截止日期不能为空');

/**
 * Shop-admin form validation, ported from the legacy Antd rules in
 * `src/pages/shop/admin/components/admin-form`.
 */
export const adminSchema = z.object({
  idCardPhotos: z.array(z.string()).superRefine((value, ctx) => {
    if (!value?.[0] && !value?.[1]) {
      ctx.addIssue({ code: 'custom', message: '电子证件照不能为空' });
      return;
    }
    if (!value[0]) {
      ctx.addIssue({ code: 'custom', message: '请上传身份证人像面' });
    }
    if (!value[1]) {
      ctx.addIssue({ code: 'custom', message: '请上传身份证国徽面' });
    }
  }),
  name: z.string().min(1, '管理员姓名不能为空').max(30, '姓名过长，不得超过30个字'),
  citizenId: z.string().refine(isIdentityCard, '请输入正确的身份证号码'),
  validdate: termSchema,
  mobile: z.string().refine(value => isMobilePhone(value, '86'), '请输入正确的中国大陆11位手机号码'),
  captcha: z.string().regex(/^\d{6}$/, '手机验证码不正确，请重新输入'),
  authLetter: z.array(z.string()).min(1, '当管理员与法人不一致的时候，请上传授权书'),
});
