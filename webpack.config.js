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
const webpack = require('webpack');
const HtmlPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { EsbuildPlugin } = require('esbuild-loader');
const Dotenv = require('dotenv-webpack');
const package = require('./package.json');

console.log('first', path.resolve(__dirname, './public'))

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
    // library: `${package.name}`,
    // libraryTarget: 'umd',
    // chunkLoadingGlobal: `webpackJsonp_${package.name}`,
    // globalObject: 'window',
  },
  devServer: {
    open: true,
    host: 'localhost',
    port: 3000,
    hot: true, // 开启HMR功能
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'public')
    }
  },
  plugins: [
    new HtmlPlugin({
      template: path.resolve('public/index.html'),
      filename: 'index.html',
      cache: false,
      // minify: true,
      inject: true,
      title: package.description,
    }),
    new CopyPlugin({
      patterns: [
        {
          context: path.resolve(__dirname, './public'),
          from: '*',
          to: path.resolve(__dirname, './dist'),
          toType: 'dir',
          globOptions: {
            dot: false,
            gitignore: false,
            // https://github.com/webpack-contrib/copy-webpack-plugin/issues/689
            // ignore: ['**/index.html'],
          },
          filter:(filepath) => {
            return !/public\/.*\.html$/.test(filepath);
          }
        },
      ],
    }),
    new Dotenv({
      path: path.join(__dirname, `.env.${process.env.NODE_ENV}`),
      safe: true,
      silent: true,
      systemvars: true,
      expand: true,
      allowEmptyValues: true,
      defaults: path.join(__dirname, '.env.defaults'),
    }),
    new webpack.ProgressPlugin({
      activeModules: true,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        use: [{
          loader: 'esbuild-loader',
          options: {
            target: 'es2015'
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
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '...'],
    alias: {
      '@': path.join(__dirname, 'src'),
    },
  },
  optimization: {
    minimize: false,
    minimizer: [
      // 在 webpack@5 中，你可以使用 `...` 语法来扩展现有的 minimizer（即 `terser-webpack-plugin`），将下一行取消注释
      // `...`,
      new CssMinimizerPlugin(),
      new EsbuildPlugin({
        target: 'es2015',
        css: true, // 优化CSS
        minify: false, // 压缩JS
        minifyWhitespace: true, // 去掉空格
        minifyIdentifiers: true, // 缩短标识符
        minifySyntax: true, // 缩短语法
        legalComments: 'none', // 去掉注释
      })
    ],
  },
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },
  externals: {
    // react: {
    //   commonjs: ['mix', 'React'],
    //   commonjs2: ['mix', 'React'],
    //   root: ['mix', 'React'],
    // },
  }
};

module.exports = (conf) => {
  console.log('conf', conf, process.env.NODE_ENV)
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
