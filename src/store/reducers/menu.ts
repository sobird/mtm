/**
 * menu.ts
 * 
 * sobird<i@sobird.me> at 2023/10/17 9:54:26 created.
 */

import { Action } from 'redux';
import { UPDATE_MENU } from '../actions/menu';
import { IMenuItem } from '@/services/menu';

export interface IMenuState {
  /** 收藏夹列表 */
  favorites?: IMenuItem[];
  /** 菜单原始列表 */
  menuItems?: IMenuItem[];
  /** 菜单树 用来渲染导航菜单 */
  menuTrees?: IMenuItem[];
  pathMap?: {
    [key in string]: IMenuItem
  },
  defaultOpenKeys?: string[];
}

export interface IMenuAction extends Action {
  type: string;
  payload: IMenuState
}

// defaultState
const initialState: IMenuState = {
  favorites: [],
  menuItems: [],
  menuTrees: [],
  pathMap: {},
  defaultOpenKeys: [],
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