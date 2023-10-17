/**
 * menu.ts
 *
 * sobird<i@sobird.me> at 2023/10/17 9:42:50 created.
 */
import { AnyAction } from 'redux';
import { IMenuState } from '../reducers/menu';

export const UPDATE_MENU = 'UPDATE_MENU';

export const updateMenu = (payload: IMenuState) => ({ type: UPDATE_MENU, payload });

export const fetchMenu = () => dispatch => {
  // 

  setTimeout(() => {
    dispatch(updateMenu({
      items: [1,2,3]
    }))
  }, 3000);
}