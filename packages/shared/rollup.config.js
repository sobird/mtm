/**
 * rollup.config.js
 * 
 * @see https://cn.rollupjs.org/configuration-options
 * sobird<i@sobird.me> at 2023/09/28 11:30:37 created.
 */

import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import image from '@rollup/plugin-image';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/lib/index.js',
      /**
       * 指定生成的 bundle 的格式（amd, cjs, es, iife, umd, system）
       * 
       * amd - 异步模块加载，适用于 RequireJS 等模块加载器 支持浏览器
       * cjs – CommonJS，适用于 Node 环境和其他打包工具（别名：commonjs）不支持浏览器
       * es – 将 bundle 保留为 ES 模块文件，适用于其他打包工具，以及支持 <script type=module> 标签的浏览器。（别名：esm，module）
       * iife – 自执行函数，适用于 <script> 标签。iife 表示“自执行 函数表达式”
       * umd – 通用模块定义规范，同时支持 amd，cjs 和 iife
       * system – SystemJS 模块加载器的原生格式（别名：systemjs）
       */
      format: 'cjs',
    },
    {
      file: 'dist/dist/index.js',
      format: 'umd',
      /**
       * 对于输出格式为 iife / umd 的 bundle 来说，若想要使用全局变量名来表示你的 bundle 时，
       * 该选项是必要的。同一页面上的其他脚本可以使用这个变量名来访问你的 bundle 输出。
       */
      name: 'MyBundle',
    },
    {
      file: 'dist/es/index.js',
      format: 'es',
      name: 'index.js',
    },

    // {
    //   file: 'bundle.min.js',
    //   format: 'iife',
    //   name: 'version',
    //   plugins: [terser()]
    // }
  ],
  plugins: [
    typescript(/*{ plugin options }*/),
    nodeResolve(),
    commonjs(),
    babel({ 
      babelHelpers: 'bundled',
      presets: ['@babel/preset-env']
    }),
    json(),
    image(),
    // terser(),
  ],
  external: ['antd', 'react', 'react-dom', '@ant-design/icons', '@ant-design/pro-components']
};