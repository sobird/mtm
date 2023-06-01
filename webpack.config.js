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
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const isProduction = process.env.NODE_ENV === 'production';
const stylesHandler = isProduction ? MiniCssExtractPlugin.loader : 'style-loader';

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
    clean: true,
  },
  devServer: {
    open: true,
    host: 'localhost',
    port: 3000,
    hot: true,
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'public')
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve('public/index.html'),
      filename: 'index.html',
      minify: true,
      inject: true,
      title: 'Webpack App',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        use: [{
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        }],
        exclude: ['/node_modules/'],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [stylesHandler, 'css-loader', 'sass-loader', 'postcss-loader'],
      },
      {
        test: /\.less$/,
        use: [stylesHandler, 'css-loader',
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                modifyVars: {
                  'primary-color': '#0080FF',
                },
                javascriptEnabled: true,
                math: 'always',
              },
            },
          },
          'postcss-loader'
        ],
      },
      {
        test: /\.css$/i,
        use: [stylesHandler, 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset',
      },
    ]
  }
};

module.exports = (env) => {
  console.log('env', env, process.env.NODE_ENV)
  if (isProduction) {
    config.mode = 'production';

    config.plugins.push(new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css',
    }));
  } else {
    config.mode = 'development';
  }
  return config;
}
