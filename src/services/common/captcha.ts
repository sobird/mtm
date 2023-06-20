/**
 * 获取验证码
 * 
 * sobird<i@sobird.me> at 2023/06/20 10:35:44 created.
 */

import http from "@/utils/http";

export interface CaptchaResponseData {
  mobile: number;
  captcha: number;
}

export default async function captcha() {
  // 随机六位数
  const i = Math.random() * (999999-100000) + 100000; 
  const captcha_num = parseInt(i as unknown as string, 10);
  
  return http.get<CaptchaResponseData>('/captcha').then(res => {
    res.captcha = captcha_num;
    return res;
  });
}