/**
 * 获取验证码
 * 
 * sobird<i@sobird.me> at 2023/06/20 10:35:44 created.
 */
import Cookies from 'js-cookie';
import http from "@/utils/http";

export interface CaptchaResponseData {
  mobile: number;
  captcha: number;
}

const CaptchaService = {
  async get(mobile: string) {
    // 随机六位数
    const i = Math.random() * (999999-100000) + 100000; 
    const captcha_num = parseInt(i as unknown as string, 10);
    
    return http.get<CaptchaResponseData>('/captcha', { mobile }).then(res => {
      res.captcha = captcha_num;
      Cookies.set('captcha', captcha_num);
      return res;
    });
  }
}

export default CaptchaService
