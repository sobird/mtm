/**
 * 商家合同签约相关
 * 
 * sobird<i@sobird.me> at 2023/09/06 21:14:38 created.
 */


import { http } from '@mtm/shared';;

export interface IContractSignRequest {
  captcha: number;
  policy: boolean;
}

const ContractService = {
  sign(data: IContractSignRequest) {
    return http.post('/merchant/contract/sign', data);
  }
}

export default ContractService;
