import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import Clipboard from 'clipboard';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import router from '@/router';
import store from '@/store';
import '@mtm/shared/es/utils/provider';
import { Empty } from '@mtm/shared'
import './App.css';

// 全局复制
const clipboard = new Clipboard('.clipboard');

clipboard.on('success', (e) => {
  message.success(`复制内容为：${e.text}`, 1);
  e.clearSelection();
});

clipboard.on('error', () => {
  // todo
});

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
    <ConfigProvider
      locale={zhCN}
      prefixCls='mtm'
      renderEmpty={componentName => {
        return <Empty />;
      }}
      theme={theme}
    >
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </ConfigProvider>
  );
}

export default App;
