/**
 * 应用级Reducer
 * 
 * sobird<i@sobird.me> at 2023/05/08 20:52:39 created.
 */

import { IAction } from '../actions';
import { SET_USER } from '../constants/app';

export type User = {
  name: string,
}

export interface IAppState {
  user: User
}

// defaultState
const initialState = {
  user: {
    name: 'sobird'
  }
};

export default function (state: IAppState = initialState, action: IAction) {
  switch (action.type) {
    case SET_USER :
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
}