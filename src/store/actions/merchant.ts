/**
 * merchant.ts
 *
 * sobird<i@sobird.me> at 2023/10/24 1:55:01 created.
 */
import { ThunkAction } from 'redux-thunk';
import { RootState } from '@/store';
import { IMerchantState, IMerchantAction } from '@/store/reducers/merchant';
import MerchantService from '@/services/merchant';

type MerchantThunkAction = ThunkAction<any, RootState, any, IMerchantAction>;

export const UPDATE_MERCHANT = 'UPDATE_MERCHANT';

// updateMerchant Action Creator
export const updateMerchantAction = (payload: IMerchantState) => { return { type: UPDATE_MERCHANT, payload }; };

/** 获取商家详情 ThunkAction */
export const fetchMerchantThunkAction: MerchantThunkAction = async (dispatch, getState, extraArgument) => {
  // const state = getState();
  return MerchantService.detail().then((res) => {
    dispatch(
      updateMerchantAction({
        ...res,
      }),
    );
    return res;
  });
};
