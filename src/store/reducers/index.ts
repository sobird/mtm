/**
 * Reducers
 *
 * sobird<i@sobird.me> at 2023/05/08 23:19:26 created.
 */

import app, { IAppState } from './app';
import menu, { IMenuState } from './menu';
import merchant, {IMerchantState } from './merchant';

export interface IStoreState {
  app: IAppState;
  menu: IMenuState;
  merchant: IMerchantState;
}

export default {
  app,
  menu,
  merchant,
};
