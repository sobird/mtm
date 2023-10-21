/**
 * 消息相关服务
 * 
 * sobird<i@sobird.me> at 2023/10/11 20:28:37 created.
 */
import { http } from '@mtm/shared';

export interface IMessageAction {
  type: number;
  name: string;
  direct: string;
}

export interface IMessage {
  id: number;
  /** 消息类型，1-重要弹窗，2-消息条,3-侧边栏通知 */
  type: number;
  title: string;
  content: string;
  createTime: string;
  publishTime: string;
  duration: number;
  /** 
   * 消息/通知样式
   * 
   * 101 = 'success', 102 = 'warning',103 = 'danger',104 = 'info'
   */
  noticeStyle: number;
  notifyEnable: boolean;
  notifyPageIds?: string[];
  actions: IMessageAction[];
}

export type IMessageBrief = Pick<IMessage, 'id' | 'type' | 'publishTime' | 'notifyPageIds'>;

const MessageService = {
  latestNews() {
    return http.get<IMessageBrief[]>('/message/latest-news');
  },
  detail(id: string) {
    return http.get<IMessage>('/message/detail', { id });
  },
};

export default MessageService;
