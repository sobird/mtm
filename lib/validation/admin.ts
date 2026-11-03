import { z } from 'zod';

/**
 * Shop-admin form validation, ported from the legacy Antd rules in
 * `src/pages/shop/admin/components/admin-form`. Task 20 will restore the
 * upload/OCR/date-picker fields; the rules for their text equivalents live here.
 */
export const adminSchema = z.object({
  name: z.string().min(1, '管理员姓名不能为空').max(30, '姓名过长，不得超过30个字'),
  citizenId: z.string().regex(/^\d{17}[\dXx]$/, '请输入正确的身份证号码'),
  validUntil: z.string().min(1, '身份证件有效截止日期不能为空'),
  mobile: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的中国大陆11位手机号码'),
  captcha: z.string().min(1, '验证码不能为空'),
});

export type AdminValues = z.output<typeof adminSchema>;
