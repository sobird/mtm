import { z } from 'zod';

import { isIdentityCard } from './id-card';
import { isMobilePhone } from './phone';

/**
 * Shop-admin form validation, ported from the legacy Antd rules in
 * `src/pages/shop/admin/components/admin-form`. Task 20 will restore the
 * upload/OCR/date-picker fields; the rules for their text equivalents live here.
 */
export const adminSchema = z.object({
  name: z.string().min(1, '管理员姓名不能为空').max(30, '姓名过长，不得超过30个字'),
  citizenId: z.string().refine(isIdentityCard, '请输入正确的身份证号码'),
  validdate: z.string().min(1, '身份证件有效截止日期不能为空'),
  mobile: z.string().refine(value => isMobilePhone(value, '86'), '请输入正确的中国大陆11位手机号码'),
  captcha: z.string().regex(/^\d{6}$/, '手机验证码不正确，请重新输入'),
});
