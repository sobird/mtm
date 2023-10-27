/**
 * 获取验证码
 * 
 * sobird<i@sobird.me> at 2023/06/20 10:35:44 created.
 */

import { message } from 'antd';
import Cookies from 'js-cookie';
import { http } from '@mtm/shared';

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

      message.success(`【美团】${res.captcha}（商户注册验证码）。工作人员不会向您索要，请勿向任何人泄露，以免造成账户或资金损失。`, 5);
      return res;
    });
  }
}

export default CaptchaService
