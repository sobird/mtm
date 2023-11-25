/**
 * common.ts
 *
 * sobird<i@sobird.me> at 2023/10/27 11:54:08 created.
 */

import Cookies from 'js-cookie';
import { message } from 'antd';
import { http } from '@mtm/shared';

interface IVersionEntity {
  appId: string;
  version: number;
  sha: string;
  deployTime: string;
  retryTimes: number;
  notifyInterval: number;
  checkInterval: number;
  forceUpdateInterval: number;
  forceUpdate: boolean;
  server: string;
}

export interface ICaptchaResponse {
  mobile: number;
  captcha: number;
}

const CommonService = {
  /** 获取系统版本信息 */
  async version() {
    return http.get<IVersionEntity>(
      '/version.json',
      { t: +new Date() },
      {
        baseURL: '/',
        parser: (res) => { return res.data; },
      },
    );
  },

  /** 生成验证码 */
  async captcha(mobile: string) {
    // 随机六位数
    const i = Math.random() * (999999 - 100000) + 100000;
    const captchaNum = parseInt(i as unknown as string, 10);

    return http.get<ICaptchaResponse>('/captcha', { mobile }).then((res) => {
      res.captcha = captchaNum;
      Cookies.set('captcha', captchaNum as unknown as string);

      message.success(`【美团】${res.captcha}（商户注册验证码）。工作人员不会向您索要，请勿向任何人泄露，以免造成账户或资金损失。`, 5);
      return res;
    });
  },

  /** 通用 验证 验证码 */
  async validateCaptcha(params: { mobilePhone: string, captcha: string }) {
    return http.post('/captcha', params);
  },
};

export default CommonService;
