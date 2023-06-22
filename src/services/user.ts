
import http from "@/utils/http";

interface RegisterRequestData {
  interCode: string;
  mobile: string;
  captcha?: string;
}

export function register(data: RegisterRequestData) {
  return http.post('/register', data);
}