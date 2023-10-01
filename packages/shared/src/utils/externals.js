/**
 * 作为子应用webpack配置项externals
 *
 * sobird<i@sobird.me> at 2023/09/13 22:23:49 created.
 */
module.exports = {
  react: {
    commonjs: ['mtm', 'React'],
    commonjs2: ['mtm', 'React'],
    root: ['mtm', 'React'],
  },
  'react-router-dom': {
    commonjs: ['mtm', 'ReactRouterDOM'],
    commonjs2: ['mtm', 'ReactRouterDOM'],
    root: ['mtm', 'ReactRouterDOM'],
  },
  'antd': {
    commonjs: ['mtm', 'Antd'],
    commonjs2: ['mtm', 'Antd'],
    root: ['mtm', 'Antd'],
  },
  '@ant-design/pro-components': {
    commonjs: ['mtm', 'AntdProComponents'],
    commonjs2: ['mtm', 'AntdProComponents'],
    root: ['mtm', 'AntdProComponents'],
  },
  '@ant-design/icons': {
    commonjs: ['mtm', 'AntdIcons'],
    commonjs2: ['mtm', 'AntdIcons'],
    root: ['mtm', 'AntdIcons'],
  },
};
