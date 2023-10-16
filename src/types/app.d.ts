// import { FC } from 'react';

declare interface Window {
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
  qiankunStarted: boolean;
  microTimer: Timeout;
}

declare let process: {
  env: {
    NODE_ENV: 'development' | 'production';
    HOST: string;
    MICRO_MTM_MARKET_URL: string;
  };
};
