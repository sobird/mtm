// import { FC } from 'react';

declare interface Window {
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
  qiankunStarted: boolean;
  microTimer: Node.Timeout;
  config: {
    appId: string;
    version: number;
    sha: string;
    deployTime: string;
    retryTimes: number;
    notifyInterval: number;
    checkInterval: number;
    forceUpdateInterval: number;
    forceUpdate: boolean;
    server: string;
  }
}

declare let process: {
  env: {
    NODE_ENV: 'development' | 'production';
    HOST: string;
    MICRO_MTM_MARKET_URL: string;
  };
};
