import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import router from '@/router';
import store from '@/store';
// import '@mtm/shared/provider';

import './App.css';

// const theme = { token: { colorPrimary: '#ffd100', borderRadius: 2, colorWhite: '#333' } };

ConfigProvider.config({
  prefixCls: 'mtm',
  // theme,
})

function App() {
  return (
    <ConfigProvider componentSize='large' locale={zhCN} prefixCls='mtm'>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </ConfigProvider>
  );
}

export default App;
