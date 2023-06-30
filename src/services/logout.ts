/**
 * 用户登出
 * 
 * sobird<i@sobird.me> at 2023/06/25 21:31:20 created.
 */

import http from "@/utils/http";

export default async function login() {
  return http.post('/logout').then( res => {
    // todo 
  });
}
