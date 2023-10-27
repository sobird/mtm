/**
 * common.ts
 * 
 * sobird<i@sobird.me> at 2023/10/27 11:54:08 created.
 */


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

const CommonService = {
  /** 获取系统版本信息 */
  version() {
    return http.get<IVersionEntity>('/version');
  }
}

export default CommonService;

