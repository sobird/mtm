/**
 * rollup.config.js
 * 
 * @see https://cn.rollupjs.org/configuration-options
 * sobird<i@sobird.me> at 2023/09/28 11:30:37 created.
 */

import { glob } from 'glob';
import { dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import external from 'rollup-plugin-peer-deps-external';
import typescript from 'rollup-plugin-typescript2';
// import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import terser from '@rollup/plugin-terser';
import image from '@rollup/plugin-image';
import json from '@rollup/plugin-json';
import copy from 'rollup-plugin-copy';
import clear from 'rollup-plugin-clear';
import mdx from '@mdx-js/rollup';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';

function input(pattern) {
  return glob.sync(pattern, {
    ignore: ['src/**/*.d.ts'],
    cwd: __dirname,
    absolute: false,
  }).reduce((map, filename) => {
    map[relative(
      'src',
      filename.slice(0, filename.length - extname(filename).length)
    )] = filename;
    return map;
  }, {});
}

const mainInput = input(['src/**/*.{ts,}', 'src/**/index.tsx']);
const mdxInput = input(['src/**/*.{mdx,}']);

function plugins(options = {}, env = {}) {
  const defaultPlugins = {
    clear: {
      targets: ['dist'],
      watch: env.watch,
    },
    external: {
      includeDependencies: true,
    },
    typescript: {
      check: false
    },
    nodeResolve: undefined,
    commonjs: undefined,
    babel: {
      babelHelpers: 'bundled',
      presets: ['@babel/preset-env']
    },
    postcss: {
      extract: true,
      minimize: isProduction,
      // plugins: [] // @see postcss.config.js
    },
    json: undefined,
    image: undefined,
    terser: undefined,
    copy: {
      targets: [
        { src: 'package.json', dest: 'dist' },
        { src: 'README.asciidoc', dest: 'dist' },
      ]
    }
  };

  if(!isProduction) {
    defaultPlugins.terser = false;
  }

  return Object.keys(defaultPlugins).reduce((_plugins, fn) => {
    const defaultConf = defaultPlugins[fn];
    const conf = options[fn];
    if(defaultConf !== false && conf !== false) {
      _plugins.push(eval(fn)({
        ...defaultConf,
        ...conf
      }));
    }
    return _plugins;
  }, [])
}

export default (env) => {
  return [
    { // es module
      input: mainInput,
      output: {
        //preserveModules: true,
        dir: "dist/es",
        format: "es",
      },
      plugins: plugins({
        clear: {
          targets: ['dist/es'],
        },
      }, env),
    },

    { // cjs module
      input: mainInput,
      output: {
        dir: 'dist/lib',
        format: 'cjs',
      },
      plugins: plugins({
        clear: {
          targets: ['dist/lib'],
        }
      }, env),
    },

    { // umd module
      input: 'src/index.ts',
      output: [
        {
          file: 'dist/dist/mtm.js',
          format: 'umd',
          name: 'mtm'
        },
        {
          file: 'dist/dist/mtm.min.js',
          // dir: 'dist/dist',
          format: 'umd',
          name: 'mtm',
          plugins: [terser()]
        }
      ],
      plugins: plugins({
        clear: {
          targets: ['dist/dist'],
        },
        typescript: {
          // umd 无需输出 d.ts 声明文件
          tsconfigOverride: { compilerOptions: { declaration: false } }
        },
        terser: false,
      }, env),
    },

    // { // mdx
    //   input: mdxInput,
    //   output: {
    //     //preserveModules: true,
    //     dir: "dist/mdx",
    //     format: "es",
    //   },
    //   plugins: [
    //     mdx()
    //   ],
    // },
  ];
}