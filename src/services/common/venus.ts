/**
 * 文件上传
 * 
 * sobird<i@sobird.me> at 2023/08/16 0:45:04 created.
 */

import { nanoid } from "nanoid";
import http from "@/utils/http";

interface IVenusSignature {
  expire: number;
  token: string;
  bucket: string;
}

interface IVenusUpload {
  md5: string;
  key: string;
  url: string;
  name: string;
  size: number;
  height: number;
  width: number;
  format: string;
}

export function signature() {
  return http.get<IVenusSignature>('/venus/sign');
}

export async function upload(file: File, progress?: (p: number) => void) {
  const { token, bucket} = await signature();

  const key = `${bucket}${nanoid()}-${file.name}`;

  const formData = new FormData();
  formData.append('key', key);
  formData.append('file', file);

  return http.service<IVenusUpload>({
    method: 'post',
    url: `/venus/upload`,
    headers: {
      Authorization: token,
    },
    data: formData,
    // responseType: 'blob',
    onUploadProgress(progressEvent) {
      progress?.(Math.floor(progressEvent.loaded / progressEvent.total * 100))
    }
  }).then(res => {
    progress(100);
    return res as IVenusUpload;
  });
}

const VenusServices = {
  signature,
  upload,
}

export default VenusServices;
