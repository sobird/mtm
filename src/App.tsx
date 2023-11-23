import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import Clipboard from 'clipboard';
import {
  ConfigProvider, theme as AntdTheme, message, ThemeConfig,
} from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import { Empty } from '@mtm/shared';
import router from '@/router';
import store from '@/store';
import '@mtm/shared/es/utils/provider';
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

const defaultToken = AntdTheme.defaultConfig.token;

const theme: ThemeConfig = {
  token: {
    borderRadius: 3,
    // controlHeight: 28

    // disabled
    colorBgContainerDisabled: '#fff',
    colorTextDisabled: '#444',
    // motion: false,

    fontFamily: '',
    fontSize: 14,
  },
  components: {
    Breadcrumb: {
      /* here is your component tokens */
      linkHoverColor: defaultToken.blue,
      separatorColor: '#c0c4cc',
    },
    Form: {
      itemMarginBottom: 20,
      labelColor: '#333',

    },
    Alert: {
      fontSize: 12,
      fontSizeLG: 14,
      paddingContentVerticalSM: 15,
    },
    Badge: {
      textFontSize: 12,
    },
    Notification: {
      motion: false,
    },
    Upload: {

    },
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
      prefixCls="mtm"
      renderEmpty={() => {
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
