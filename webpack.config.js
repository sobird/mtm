/**
 * webpack.config.js
 *
 * @see https://webpack.js.org/concepts/configuration/
 *
 * 通过将 mode 选项设置为 production，启用 minification(代码压缩) 和 tree shaking
 *
 * sobird<i@sobird.me> at 2019-11-06 16:53:47 build.
 */
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  devtool: isProduction ? false : 'inline-source-map',
  entry: {
    app: [
      './src/index.tsx',
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    // pathinfo: true,
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    publicPath: '/',
  },
  devServer: {
    open: true,
    host: 'localhost',
    port: 3000,
    hot: true,
    historyApiFallback: true,
  },
};

module.exports = (env) => {
  console.log('env', env, process.env.NODE_ENV)
  if (isProduction) {
    config.mode = 'production';

  } else {
    config.mode = 'development';
  }
  return config;
}
