/**
 * menu.ts
 *
 * sobird<i@sobird.me> at 2023/10/17 9:42:50 created.
 */
import { ThunkAction } from 'redux-thunk';
import { IMenuState, IMenuAction } from '@/store/reducers/menu';
import MenuService, { IMenuItem } from '@/services/menu';
import { RootState } from '@/store';

type MenuThunkAction = ThunkAction<any, RootState, any, IMenuAction>;

export const UPDATE_MENU = 'UPDATE_MENU';

// updateMenu Action Creator
export const updateMenuAction = (payload: IMenuState) => ({ type: UPDATE_MENU, payload });

export const fetchMenuThunkAction: MenuThunkAction = async (dispatch, getState, extraArgument) => {
  // const state = getState();

  return MenuService.list().then(([menuTrees, menuItems, favorites]) => {
    // const menuTrees = [First, Favorites, ...Others];
    const defaultOpenKeys = menuTrees.filter(item => item.children && item.children.length > 0).map(item => item.id);

    dispatch(
      updateMenuAction({
        favorites,
        menuItems,
        menuTrees,
        // 默认菜单全打开
        defaultOpenKeys: [...new Set(defaultOpenKeys)],
      })
    );
  });
};

// 移除收藏夹菜单项
export const removeFavMenuItem = (menuItem: IMenuItem) => {
  const thunkAction: MenuThunkAction = async (dispatch, getState) => {
    const state = getState();
    const { favorites } = state.menu;

    const index = favorites.findIndex(item => item.id === menuItem.id);

    if(index !== -1) {
      favorites.splice(index, 1);
    }

    /**
     * @todo 可调用接口更新到后端
     */
    dispatch(updateMenuAction({
      favorites,
    }))
  };

  return thunkAction;
};
// 添加收藏夹菜单项
export const insertFavMenuItem = (menuItem: IMenuItem) => {
  const thunkAction: MenuThunkAction = async (dispatch, getState) => {
    const state = getState();
    const { favorites } = state.menu;

    favorites.push(menuItem);

    /**
     * @todo 可调用接口更新到后端
     */
    dispatch(updateMenuAction({
      favorites,
    }))
  };

  return thunkAction;
};

