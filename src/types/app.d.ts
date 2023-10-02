// 全局参数定义
declare interface Window {
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
  qiankunStarted: boolean;
  $store: object;
}

declare let process: {
  env: {
    NODE_ENV: string;
    HOST: string;
    MICRO_MTM_MARKET_HOST: string;
  };
};
