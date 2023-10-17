/**
 * menu.ts
 * 
 * sobird<i@sobird.me> at 2023/10/17 9:54:26 created.
 */

import { AnyAction } from 'redux';
import { UPDATE_MENU } from '../actions/menu';

export interface IMenuState {
  items: any[];
}

// defaultState
const initialState: IMenuState = {
  items: []
};

export default (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case UPDATE_MENU :
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
}