/**
 * 应用级Action
 * 
 * sobird<i@sobird.me> at 2023/05/08 22:54:36 created.
 */

import { SET_USER, TOGGLE_ASIDE } from "../constants/app"
import { User } from "../reducers/app"

export function setUser(payload: User) {
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
