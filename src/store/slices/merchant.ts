/**
 * merchant slice
 *
 * sobird<i@sobird.me> at 2023/11/24 19:28:42 created.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { IMerchantEntity } from '@/services/merchant.d';
import MerchantService from '@/services/merchant';

export type IMerchantState = Partial<IMerchantEntity>;

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

export const fetchMerchant = createAsyncThunk('metchant/fetch', async () => {
  // const state = getState();
  return MerchantService.detail();
});

const merchantSlice = createSlice({
  name: 'merchant',
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchMerchant.pending, (state, action) => {
        // state.status = 'loading'
        console.log('state', state, action);
      })
      .addCase(fetchMerchant.fulfilled, (state, action) => {
        return {
          ...state,
          ...action.payload,
        };
      });
  },
  reducers: {
    updateMerchant: (state, action: PayloadAction<IMerchantState>) => {
      // state = action.payload;
      return {
        ...state,
        ...action.payload,
      };
    },
  },
});

export const { updateMerchant } = merchantSlice.actions;
export default merchantSlice.reducer;
