import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import router from '@/router';
import { MasterContext } from '@/utils/context';
import './App.scss';

interface AppProps {
  master: any;
}

console.log('antdTheme', theme.getDesignToken(), theme.defaultConfig.token);

const defaultToken = theme.defaultConfig.token;

const App: React.FC<AppProps> = ({ master = {} }) => {
  return (
    <ConfigProvider
      locale={zhCN}
      prefixCls='mtm'
      theme={{
        token: {
          borderRadius: 3,
          // controlHeight: 28

          // disabled
          colorBgContainerDisabled: '#fff',
          colorTextDisabled: '#444',
        },
        components: {
          Breadcrumb: {
            /* here is your component tokens */
            linkHoverColor: defaultToken.blue,
            separatorColor: '#c0c4cc',
          },
          Form: {
            itemMarginBottom: 20,
            labelColor: "#333"
          },
          Badge: {
            textFontSize: 12,
          },
        },
      }}
    >
      <MasterContext.Provider value={master}>
        <RouterProvider router={router} />
      </MasterContext.Provider>
    </ConfigProvider>
  );
};

console.log('process.env.NODE_ENV', process.env.NODE_ENV)

export default App;
