/**
 * merchant.ts
 *
 * sobird<i@sobird.me> at 2023/10/24 1:43:57 created.
 */

import { Action } from 'redux';
import { UPDATE_MERCHANT } from '@/store/actions/merchant';
import { IMerchantEntity } from '@/services/merchant.d';

export type IMerchantState = Partial<IMerchantEntity>;
export interface IMerchantAction extends Action {
  type: string;
  payload: IMerchantState
}

const initialState: IMerchantState = {
  shopInfo: {},
  enteredCompanyInfo: {},
  legalPersonInfo: {},
  merchantManagerInfo: {},
  contactInfo: {},
  merchantType: '',
  licenseList: [],
  legalPersonManagerSame: false,
  activityTab: '',
  showButtonConfig: false,
  walletData: {
    merchantWalletList: [],
    account: '',
    phoneMask: '',
    phone: '',
  },
  loginAccountIsMaster: false,
  exited: false,
  imInfo: {
    imSeparateOnShadow: false,
  },
};

export default (state = initialState, action: IMerchantAction = { type: '', payload: {} }) => {
  switch (action.type) {
    case UPDATE_MERCHANT:
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};
