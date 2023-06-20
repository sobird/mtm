/**
 * 获取验证码
 * 
 * sobird<i@sobird.me> at 2023/06/20 10:35:44 created.
 */

import http from "@/utils/http"

export default function captcha() {
  return http.get('/captcha');
}
