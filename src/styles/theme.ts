/**
 * antd theme token
 *
 * sobird<i@sobird.me> at 2023/10/20 10:26:16 created.
 */

import { theme } from 'antd';

console.log('AntdTheme', theme.getDesignToken(), theme.defaultConfig.token);

export default {
  token: {
    colorPrimary: '#ffd100',
    borderRadius: 2,
    colorWhite: '#333',
    motion: false,
  },
};
