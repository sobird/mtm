/**
 * authorisation
 *
 * sobird<i@sobird.me> at 2023/06/22 21:40:58 created.
 */

import { http } from '@mtm/shared';
import { signJWT } from '@/utils/jwt';

export interface ILoginRequest {
  interCode: string;
  mobile: string;
  captcha?: string;
}

export interface ILoginResponse {
  token: string;
  mobile?: string;
}

const AuthService = {
  async login(data: ILoginRequest) {
    const { mobile } = data;
    return http.post<ILoginResponse>('/auth/login', data).then(async (res) => {
      const token = await signJWT({
        mobile,
      });

      res.token = token;
    });
  },

  async logout() {
    return http.post('/auth/logout').then((res) => {
      // todo
      console.log('res', res);
    });
  },
};

export default AuthService;
