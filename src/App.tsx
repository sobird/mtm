import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import router from '@/router';
import store from '@/store';
import './provider';

import './App.css';

const theme = {
  token: {
    // colorPrimary: '#ffd100',
    borderRadius: 3,
    // colorWhite: '#333',
    motion: false,
  },
};

ConfigProvider.config({
  prefixCls: 'mtm',
  // theme,
});

function App() {
  return (
    <ConfigProvider locale={zhCN} prefixCls='mtm' theme={theme}>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </ConfigProvider>
  );
}

export default App;
