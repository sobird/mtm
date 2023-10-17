/**
 * menu.ts
 * 
 * sobird<i@sobird.me> at 2023/10/17 9:54:26 created.
 */

import { Action } from 'redux';
import { UPDATE_MENU } from '../actions/menu';
import { IMenuItem } from '@/services/menu';

export interface IMenuState {
  firstItem?: IMenuItem;
  favorites?: IMenuItem[];
  menuItems?: IMenuItem[];
  menuTrees?: IMenuItem[];
  pathMap?: {
    [key in string]: IMenuItem
  }
}

export interface IMenuAction extends Action {
  type: string;
  payload: IMenuState
}

// defaultState
const initialState: IMenuState = {
  firstItem: null,
  favorites: [],
  menuItems: [],
  menuTrees: [],
  pathMap: {},
};

export default (state = initialState, action: IMenuAction) => {
  switch (action.type) {
    case UPDATE_MENU :
      return {
        ...state,
        ...action.payload
      };
    default:
      return state;
  }
}