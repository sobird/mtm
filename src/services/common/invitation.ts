/**
 * 邀请码
 *
 * sobird<i@sobird.me> at 2023/06/30 16:00:06 created.
 */

import { http } from '@mtm/shared';

export interface IInvitationRequestData {
  code: number | string;
}

export default {
  post(data: IInvitationRequestData) {
    return http.post('/invitation', data);
  },
};
