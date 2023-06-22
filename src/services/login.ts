/**
 * 商家登录
 * 
 * sobird<i@sobird.me> at 2023/06/22 21:40:58 created.
 */
import http from "@/utils/http";
import { signJWT } from "@/utils/jwt";

export interface ILoginRequest {
  interCode: string;
  mobile: string;
  captcha?: string;
}

export interface ILoginResponse {
  token: string;
  mobile?: string;
}

export default async function login(data: ILoginRequest) {
  const { mobile } = data;
  return http.post<ILoginResponse>('/login', data).then(async res => {
    const token = await signJWT({
      mobile,
    });

    res.token = token
  });
}