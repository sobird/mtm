/**
 * webpack.config.js
 *
 * @see https://webpack.js.org/concepts/configuration/
 *
 * 通过将 mode 选项设置为 production，启用 minification(代码压缩) 和 tree shaking
 *
 * sobird<i@sobird.me> at 2023/09/13 23:18:03 created.
 */

const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const HtmlPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { PurgeCSSPlugin } = require('purgecss-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { EsbuildPlugin } = require('esbuild-loader');
const Dotenv = require('dotenv-webpack');
const { ModuleFederationPlugin } = require('webpack').container;
const externals = require('@mtm/shared/utils/externals.js');
const pkg = require('./package.json');

const PORT = 3001;
const envs = new Map([
  ['local', {
    outputPath: path.resolve(__dirname, `../../dist/${pkg.name}`),
    publicPath: `/${pkg.name}/`,
  }],
  [
    'development', {
      outputPath: path.resolve(__dirname, './dist'),
      publicPath: `http://localhost:${PORT}/`,
    }
  ],
  [
    'production', {
      outputPath: path.resolve(__dirname, './dist'),
      publicPath: `/${pkg.name}/`,
    }
  ]
]);

const isProduction = process.env.NODE_ENV === 'production';
const stylesHandler = isProduction ? MiniCssExtractPlugin.loader : 'style-loader';

const env = envs.get(process.env.NODE_ENV);

const config = {
  devtool: isProduction ? false : 'inline-source-map',
  entry: {
    app: [
      './src/index.tsx',
    ],
  },
  target: 'web',
  output: {
    path: env.outputPath,
    publicPath: env.publicPath,
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    assetModuleFilename: 'assets/[contenthash][ext][query]',
    clean: true,
    library: `${pkg.name}`,
    libraryTarget: 'umd',
    chunkLoadingGlobal: `webpackJsonp_${pkg.name}`,
    globalObject: 'window',
  },
  devServer: {
    open: true,
    host: '0.0.0.0',
    port: PORT,
    hot: true, // 开启HMR功能
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'public')
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  plugins: [
    new HtmlPlugin({
      template: path.resolve('public/index.html'),
      filename: 'index.html',
      cache: false,
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        minifyJS: true,
        minifyCSS: true,
      },
      inject: true,
      title: pkg.description,
    }),
    new CopyPlugin({
      patterns: [
        {
          context: path.resolve(__dirname, './public'),
          from: '**/*',
          to: env.outputPath,
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
    // new ModuleFederationPlugin({
    //   name: pkg.name,
    //   filename: 'remoteEntry.js',
    //   // library: { 
    //   //   type: 'umd', 
    //   //   name: pkg.name
    //   // },
    //   exposes: {
    //     './Campaign': './src/remotes/campaign',
    //     './newReact': require.resolve('react'),
    //     './newReactDOM': require.resolve('react-dom/client')
    //   },
    // }),
    // new PurgeCSSPlugin({
    //   paths: glob.sync(`${path.resolve(__dirname, './src')}/**/*.{tsx,scss,less,css}`, { nodir: true }),
    //   whitelist: ['html', 'body']
    // }),
    // new BundleAnalyzerPlugin({
    //   analyzerMode: 'static',
    //   analyzerHost: '127.0.0.1',
    //   analyzerPort: 8888,
    // }),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        use: [{
          loader: 'esbuild-loader',
          options: {
            target: 'es2018'
          },
        }],
        exclude: ['/node_modules/'],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [stylesHandler, 'css-loader', 'postcss-loader', 'sass-loader'],
      },
      {
        test: /\.less$/,
        use: [stylesHandler, 'css-loader',
          {
            loader: 'less-loader',
            options: {
              // lessOptions: {
              //   modifyVars: {
              //     'primary-color': '#0080FF',
              //     '@ant-prefix': 'mtm',
              //   },
              //   javascriptEnabled: true,
              //   math: 'always',
              // },
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
    // minimize: false,
    minimizer: [
      // 在 webpack@5 中，你可以使用 `...` 语法来扩展现有的 minimizer（即 `terser-webpack-plugin`），将下一行取消注释
      // `...`,
      new CssMinimizerPlugin(),
      new EsbuildPlugin({
        // target: 'es2018',
        css: true, // 优化CSS
        minify: false, // 压缩JS
        minifyWhitespace: true, // 去掉空格
        minifyIdentifiers: true, // 缩短标识符
        minifySyntax: true, // 缩短语法
        legalComments: 'none', // 去掉注释
      })
    ],
  },
  // cache: {
  //   type: 'filesystem',
  //   buildDependencies: {
  //     config: [__filename],
  //   },
  // },
};

module.exports = (conf) => {
  if (isProduction) {
    config.mode = 'production';

    config.plugins.push(new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css',
    }));
    // config.plugins.push(new webpack.SourceMapDevToolPlugin({
    //   test: /\.(tsx|jsx|js)$/,
    //   filename: '[file].map',
    //   publicPath: '/',
    // }));
    config.externals = externals;
  } else {
    config.mode = 'development';
    config.externals = externals;
  }
  return config;
}