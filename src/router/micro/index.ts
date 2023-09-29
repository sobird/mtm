/**
 * 微前端配置
 * 
 * sobird<i@sobird.me> at 2023/09/24 21:16:11 created.
 */

import { registerMicroApps, prefetchApps, start, runAfterFirstMounted, initGlobalState, addGlobalUncaughtErrorHandler, MicroAppStateActions, FrameworkConfiguration } from 'qiankun';
import apps from './apps';
import lifeCycles from './lifeCycles';

// 预加载资源
prefetchApps(apps);
// 注册微应用
registerMicroApps(apps, lifeCycles);

/**
 * 添加全局的未捕获异常处理器
 */
addGlobalUncaughtErrorHandler((event: Event) => {
  if (event?.type === 'unhandledrejection' && event?.reason?.message === 'Failed to fetch') {
    event.preventDefault();
  }
});

// 初始化 state
const actions: MicroAppStateActions = initGlobalState({
  menusMap: null,
});

actions.onGlobalStateChange((state, prev) => {
  // state: 变更后的状态; prev 变更前的状态
  console.log(state, prev);
});
// actions.setGlobalState(state);
// actions.offGlobalStateChange();

/**
 * setGlobalState 更新 store 数据
 *
 * 1. 对输入 state 的第一层属性做校验，只有初始化时声明过的第一层（bucket）属性才会被更改
 * 2. 修改 store 并触发全局监听
 *
 * @param state
 */
export function setGlobalState(state: object) {
  actions.setGlobalState(state);
}

runAfterFirstMounted(() => {
  console.log('[MainApp] first app mounted');
});

const startQiankun = (opts?: FrameworkConfiguration) => {
  start({
    ...opts,
  });
};
export default startQiankun;
