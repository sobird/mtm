/**
 * OCR文字识别接口服务
 *
 * sobird<i@sobird.me> at 2023/08/15 23:44:11 created.
 */

import { http } from '@mtm/shared';

export interface IOcrRequestData {
  type: number;
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

const OcrService = {
  get(params?: IOcrRequestData) {
    return http.get<IOcrResponseData[]>('/ocr', params);
  },
};

export default OcrService;
