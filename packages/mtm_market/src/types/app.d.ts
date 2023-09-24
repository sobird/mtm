// 全局参数定义
declare interface Window {
  __POWERED_BY_QIANKUN__: boolean;
  __INJECTED_PUBLIC_PATH_BY_QIANKUN__: any;
}

declare let process: {
  env: {
    NODE_ENV: string;
    HOST: string;
  };
};
