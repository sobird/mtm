/**
 * 微前端配置
 * 
 * sobird<i@sobird.me> at 2023/09/24 21:16:11 created.
 */

import { registerMicroApps, prefetchApps, start, runAfterFirstMounted, addGlobalUncaughtErrorHandler, FrameworkConfiguration } from 'qiankun';
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

runAfterFirstMounted(() => {
  console.log('[MainApp] first app mounted');
});

const startQiankun = (opts?: FrameworkConfiguration) => {
  start({
    ...opts,
  });
};
export default startQiankun;
