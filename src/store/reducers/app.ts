/**
 * 应用级Reducer
 * 
 * sobird<i@sobird.me> at 2023/05/08 20:52:39 created.
 */
import Cookies from 'js-cookie';
import { IAction } from '../actions';
import { SET_USER, TOGGLE_ASIDE, UPDATE_MICRO } from '../actions/app';

export type User = {
  name: string,
}

export interface IAppState {
  user: User,
  collapsed: boolean;
  micro: {
    loading: boolean
  };
}

// defaultState
const initialState = {
  user: {
    name: 'sobird'
  },
  collapsed: Cookies.get(TOGGLE_ASIDE) === '1',
  micro: {
    loading: false
  }
};

export default function (state: IAppState = initialState, action: IAction) {
  switch (action.type) {
    case SET_USER :
      return {
        ...state,
        user: action.payload,
      };
    case TOGGLE_ASIDE:
      if (state.collapsed) {
        Cookies.set(TOGGLE_ASIDE, '0', {
          path: '/',
        });
      } else {
        Cookies.set(TOGGLE_ASIDE, '1', {
          path: '/',
        });
      }
  
      // 主动触发window.resize事件
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 300);
  
      return {
        ...state,
        collapsed: !state.collapsed,
      };
    case UPDATE_MICRO :
      return {
        ...state,
        micro: action.payload,
      };
    default:
      return state;
  }
}