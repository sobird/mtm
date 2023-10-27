/**
 * 文件上传
 *
 * sobird<i@sobird.me> at 2023/08/16 0:45:04 created.
 */

import { AxiosProgressEvent } from 'axios';
import { nanoid } from 'nanoid';
import { http, HttpRequestConfig } from '@mtm/shared';

/** 1 私密; 2 公开 */
type IType = 1 | 2;
interface IVenusSignature {
  expire: number;
  token: string;
  bucket: string;
  host: string;
}

export interface IVenusUploadResponse {
  md5: string;
  key: string;
  url: string;
  name: string;
  size: number;
  height: number;
  width: number;
  format: string;
}

export interface IUploadRequestConfig extends HttpRequestConfig {
  filename?: string;
  type?: IType;
  data?: object;
  onProgressPercent?: (percent: number, progressEvent?: AxiosProgressEvent) => void;
}

/**
 * 获取签名信息
 *
 * @param type 上传类型 1 私密; 2 公开
 * @returns Promise
 */
export function signature(type: IType = 1) {
  return http.get<IVenusSignature>('/venus/sign', { type });
}

/**
 * 文件上传
 *
 * @param file 文件对象
 * @param type 上传类型 1 私密; 2 公开
 * @param progress 上传进度回调函数
 * @returns
 */
export async function upload(file: File, config: IUploadRequestConfig = {}) {
  const { filename = 'file', headers, data = {}, type = 1, onProgressPercent, ...others } = config;
  const { token, bucket, expire } = await signature(type);
  const key = `${bucket}${nanoid()}-${file.name}`;

  return http.upload<IVenusUploadResponse>('/venus/upload', {
    ...data,
    [filename]: file,
    key,
  },{
    headers: {
      Authorization: token,
      expire,
      bucket,
      ...headers,
    },
    // responseType: 'blob',
    onUploadProgress(progressEvent) {
      onProgressPercent?.(Math.floor((progressEvent.loaded / progressEvent.total) * 100), progressEvent);
    },
    ...others,
  }).then(res => {
    onProgressPercent(100);
    return res as unknown as IVenusUploadResponse;
  });
}


export interface IOcrRequestData {
  type: 0 | 1 | 3 | number;
  url: string;
}

export interface IOcrResponseData {
  cardInfo: {
    [key: string]: any;
  };
  bzLicenseInfo: {
    [key: string]: any;
  };
  brandLicenseInfo: {
    [key: string]: any;
  };
}

export async function ocr(params?: IOcrRequestData) {
  return http.get<IOcrResponseData>('/venus/ocr', params).then(res => {
    if(params?.type !== undefined) {
      return res[params.type];
    }

    return res;
  });
}

const VenusService = {
  signature,
  upload,
  ocr,
};

export default VenusService;
