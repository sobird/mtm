/**
 * numeral.js
 * 初始化numeral默认配置，及对numeral扩展
 *
 * @example
 * 分转元
 * numeral(1000).divide(100).format('0.00') === 10;
 * 四舍五入两位小数
 * numeral(28.3656).format('0.00') === '28.37';
 * numeral(28.3656).round(2) === 28.37;
 *
 * 千分位格式化
 * numeral(10000000).format('0,0') === '10,000,000'
 *
 * @see https://github.com/adamwdraper/Numeral-js
 * sobird<i@sobird.me> at 2021/06/09 19:06:12 created.
 */

import numeral from 'numeral';

declare module 'numeral' {
  interface Numeral {
    /**
     * 根据 precision（精度） 四舍五入 number
     * 注意与银行家舍入的区别
     */
    round(precision?: number): number | null;
    isFloat(n?: any): boolean;
  }
  interface NumeralJSUtils {
    insert: (string: string, subString: string, start: number) => string;
    includes: (string: string, search: string) => boolean;
    isNaN: (value: any) => boolean;
    reduce: (array: [], callback: () => void) => any;
    /**
     * Computes the multiplier necessary to make x >= 1,
     *
     * effectively eliminating miscalculations caused by finite precision.
     */
    multiplier: (number: number) => number;

    /**
     * Given a variable number of arguments, returns the maximum
     * multiplier that must be used to normalize an operation involving
     * all of them.
     */
    correctionFactor: () => void;
    /**
     * Implementation of toFixed() that treats floats more like decimals
     *
     * Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
     * problems for accounting- and finance-related software.
     */
    toFixed: (
      value: number,
      maxDecimals: number,
      roundingFunction: (number: number) => number,
      optionals: number
    ) => string;
  }
}

export const LOCALE = {
  delimiters: {
    thousands: ',',
    decimal: '.',
  },
  abbreviations: {
    thousand: '千',
    million: '百万',
    billion: '十亿',
    trillion: '兆',
  },
  ordinal() {
    return '.';
  },
  currency: {
    symbol: '¥',
  },
};

numeral.register('locale', 'zh', LOCALE);
numeral.locale('zh');
// numeral.zeroFormat('零');
numeral.nullFormat('');
// numeral.defaultFormat('0.00');

/**
 * 四舍五入
 *
 * @param precision
 * @returns
 */
numeral.fn.round = function round(precision = 2) {
  return Math.round(10 ** precision * this.value()) / 10 ** precision;
};

numeral.fn.isFloat = function isFloat() {
  const n: any = this.value();
  return parseInt(n, 10) < parseFloat(n);
};

/**
 * 自定义格式化，这是一段示例代码
 *
 * @example
 * numeral(0.001).format('0.00&')
 */
numeral.register('format', 'custom formats', {
  regexps: {
    format: /(&)/,
    unformat: /(&)/,
  },
  format(value, format, roundingFunction) {
    const space = numeral._.includes(format, ' %') ? ' ' : '';
    let output;
    const newValue = value * 100;

    // check for space before %
    const newFormat = format.replace(/\s?%/, '');

    output = numeral._.numberToFormat(newValue, newFormat, roundingFunction);

    if (numeral._.includes(output, ')')) {
      output = output.split('');
      output.splice(-1, 0, `${space}%`);
      output = output.join('');
    } else {
      output = `${output}${space}%`;
    }

    return output;
  },
  unformat(string) {
    return numeral._.stringToNumber(string) * 0.01;
  },
});

export default numeral;
