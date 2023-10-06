/**
 * 日期处理类库
 *
 * @example
 * （1）今天：[moment().startOf('day'), moment().endOf('day')]
 * （2）最近一个月：[moment().subtract(1, 'months'), moment()]
 *
 * @see https://momentjs.com/docs/
 * sobird<i@sobird.me> at 2021/06/09 21:09:53 created.
 */

import moment from 'dayjs';
import 'dayjs/locale/zh-cn';
import weekday from 'dayjs/plugin/weekday'
import localeData from 'dayjs/plugin/localeData'

const { parse, format } = moment.prototype;

/**
 * 设置中文本地化语言
 */
moment.locale('zh-cn');

/** 兼容 13位/10位 数字时间戳参数 */
moment.prototype.parse = function (config: any) {
  const { date } = config;

  if (Number.isInteger(date) && String(date).length === 10) {
    config.date = moment.unix(date);
  }

  console.log('parse.bind(this)(config)', config)
  return parse.bind(this)(config);
};

moment.prototype.format = function (formatStr: string = 'YYYY-MM-DD HH:mm:ss') {
  return format.bind(this)(formatStr);
}

moment.extend(weekday)
moment.extend(localeData)

/**
 * 设置默认的日期格式化
 */
// dayjs.defaultFormat = 'YYYY-MM-DD HH:mm:ss';

export default moment;
