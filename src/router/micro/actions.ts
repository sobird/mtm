/**
 * actions.ts
 * 
 * sobird<i@sobird.me> at 2023/10/02 19:35:21 created.
 */

import { initGlobalState, MicroAppStateActions } from 'qiankun';

const initState = {
  microLoading: false,
};

// 初始化 state
const actions: MicroAppStateActions & {
  getGlobalState?: () => Record<string, any>;
} = initGlobalState(initState);

actions.onGlobalStateChange((state, prev) => {
  // state: 变更后的状态; prev 变更前的状态
  console.log(state, prev);
});

actions.getGlobalState = () => {
  return initState;
}

export default actions;
