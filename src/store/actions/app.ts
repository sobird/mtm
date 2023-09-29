/**
 * 应用级Action
 * 
 * sobird<i@sobird.me> at 2023/05/08 22:54:36 created.
 */

import { IAppState } from "../reducers/app"

export const SET_USER = 'SET_USER';
export const TOGGLE_ASIDE = 'TOGGLE_ASIDE';
export const UPDATE_MICRO = 'UPDATE_MICRO';

export function setUser(payload: IAppState['user']) {
  return {
    type: SET_USER,
    payload,
  }
}

export function toggleAside() {
  return {
    type: TOGGLE_ASIDE,
  };
}

export const updateMicro = (payload: IAppState['micro']) => ({
  type: UPDATE_MICRO,
  payload,
});
