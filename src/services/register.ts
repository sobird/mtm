
import http from "@/utils/http";

interface IRegisterRequest {
  interCode: string;
  mobile: string;
  captcha?: string;
}

export default function register(data: IRegisterRequest) {
  return http.post('/register', data);
}