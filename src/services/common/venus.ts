/**
 * 文件上传
 * 
 * sobird<i@sobird.me> at 2023/08/16 0:45:04 created.
 */

import http from "@/utils/http";
import { nanoid } from "nanoid";

interface IVenusSignature {
  expire: number;
  token: string;
  bucket: string;
}

export function signature() {
  return http.get<IVenusSignature>('/venus/sign');
}

export async function upload(file: File) {
  const sign = await signature();

  const key = `${sign.bucket}${nanoid()}-${file.name}`;

  const formData = new FormData();
  formData.append('key', key);
  formData.append('file', file);

  return http.service({
    method: 'post',
    url: `/venus/upload`,
    headers: {
      Authorization: sign.token,
    },
    data: formData,
    responseType: 'blob',
  });
}

const VenusServices = {
  signature,
  upload
}

export default VenusServices;
