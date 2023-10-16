declare interface Window {
  __POWERED_BY_QIANKUN__: boolean;
  __INJECTED_PUBLIC_PATH_BY_QIANKUN__: any;
}

declare let process: {
  env: {
    NODE_ENV: 'development' | 'production';
    /** axios baseURL */
    baseURL: string;
    /** 商家店铺扫码跳转页 */
    SHOP_JUMP_URL: string;
  };
};
