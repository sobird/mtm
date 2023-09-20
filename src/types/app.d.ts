// 全局参数定义
declare interface Window {
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
}

declare let process: {
  env: {
    NODE_ENV: string;
    HOST: string;
    MTM_MARKET_HOST: string;
  };
};
