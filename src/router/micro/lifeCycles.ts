/**
 * qiankun 生命周期钩子 - 微应用加载前
 * 
 * sobird<i@sobird.me> at 2023/09/25 1:27:45 created.
 */

const lifeCycles = {
  // qiankun 生命周期钩子 - 微应用加载前
  beforeLoad: (app: any) => {
    // 加载微应用前，加载进度条
    console.log('before load！', app.name);
    return Promise.resolve();
  },
  beforeMount: (app: any) => {
    // 加载微应用前，加载进度条
    console.log('before mount！', app.name);
    return Promise.resolve();
  },
  // qiankun 生命周期钩子 - 微应用挂载后
  afterMount: (app: any) => {
    // 加载微应用前，进度条加载完成
    console.log('after mount！', app.name);
    return Promise.resolve();
  },
  beforeUnmount: (app: any) => {
    // 卸载微应用前
    console.log('beforeUnmount！', app.name);
    return Promise.resolve();
  },
  afterUnmount: (app: any) => {
    // 卸载微应用完成
    console.log('afterUnmount', app.name);
    return Promise.resolve();
  },
};

export default lifeCycles;
