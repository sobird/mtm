/**
 * qiankun 生命周期钩子 - 微应用加载前
 *
 * sobird<i@sobird.me> at 2023/09/25 1:27:45 created.
 */

// import store from '@/store';
// import { updateMicro } from '@/store/slices/app';

const lifeCycles = {
  // qiankun 生命周期钩子 - 微应用加载前
  beforeLoad: (app: any) => {
    // 加载微应用前，加载进度条
    console.log(app.name, 'before load');
    // store.dispatch(updateMicro({ loading: true }));
    return Promise.resolve();
  },
  beforeMount: (app: any) => {
    // 加载微应用前，加载进度条
    console.log(app.name, 'before mount');
    return Promise.resolve();
  },
  // qiankun 生命周期钩子 - 微应用挂载后
  afterMount: (app: any) => {
    // 加载微应用前，进度条加载完成
    console.log(app.name, 'after mount');
    // store.dispatch(updateMicro({ loading: false }));
    return Promise.resolve();
  },
  beforeUnmount: (app: any) => {
    // 卸载微应用前
    console.log(app.name, 'before unmount');
    return Promise.resolve();
  },
  afterUnmount: (app: any) => {
    // 卸载微应用完成
    console.log(app.name, 'after unmount');
    return Promise.resolve();
  },
};

export default lifeCycles;
