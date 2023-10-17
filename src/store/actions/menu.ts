/**
 * menu.ts
 *
 * sobird<i@sobird.me> at 2023/10/17 9:42:50 created.
 */
import { ThunkAction } from 'redux-thunk';
import { IMenuState, IMenuAction } from '@/store/reducers/menu';
import MenuService from '@/services/menu';

type MenuThunkAction = ThunkAction<any, IMenuState, any, IMenuAction>;

export const UPDATE_MENU = 'UPDATE_MENU';

// updateMenu Action Creator
export const updateMenuAction = (payload: IMenuState) => ({ type: UPDATE_MENU, payload });

export const fetchMenuThunkAction: MenuThunkAction = async (dispatch, getState, extraArgument) => {
  const state = getState();
  console.log('extraArgument', extraArgument, state);

  return MenuService.list().then(([First, Favorites, Others, menuItems, favorites]) => {
    dispatch(
      updateMenuAction({
        firstItem: First,
        favorites: favorites,
        menuItems: menuItems,
        menuTrees: [First, Favorites, ...Others],
      })
    );
  });
};
