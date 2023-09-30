/**
 * gulpfile.js
 * 
 * sobird<i@sobird.me> at 2023/09/30 16:02:42 created.
 */

import gulp from "gulp";
import { rollup } from 'rollup'
import ts from 'gulp-typescript';
import File from 'vinyl'
// 用来创建内联插件
import through2, { obj }  from 'through2';
import rollupConfig from './rollup.config.js';

const { src, dest, parallel, series, watch } = gulp;
const DEST = './dist';

const rollupGulpPlugin = obj(function (file, encoding, cb) {
  console.log('file', file.path)
  rollup({
    input: file.path,
    plugins: rollupConfig.plugins
  }).then(bundle => {
    console.log('bundle', bundle)
    bundle.generate({
      // file: './dist/es/index.js',
      format: 'umd',
      name: 'index.js',
      
    },).then(({ output })=> {
      console.log('output', output)
      const [out] = output;
      console.log('out', out)
      file.contents = Buffer.from(out.code);

      let styleFile = file.clone();
      styleFile.contents = Buffer.from('123');
      styleFile.extname = '.css';

      this.push(styleFile);
      cb(null, file);
    });
  })
  
})

export const test = () => {
  //
  return src('./src/index.ts').pipe(ts()).pipe(rollupGulpPlugin).pipe(obj(function(file, encoding, cb) {
    console.log('file123', file)
    cb(null, file)
  })).pipe(dest(DEST));
};

export default () => {
  //
}