/**
 * 作为子应用webpack配置项externals
 * 
 * sobird<i@sobird.me> at 2023/09/13 22:23:49 created.
 */


export default {
  react: {
    commonjs: ['mtm', 'React'],
    commonjs2: ['mtm', 'React'],
    root: ['mtm', 'React'],
  },
  'react-router-dom': {
    commonjs: ['mtm', 'ReactRouterDOM'],
    commonjs2: ['mtm', 'ReactRouterDOM'],
    root: ['mtm', 'ReactRouterDOM'],
  }
}
