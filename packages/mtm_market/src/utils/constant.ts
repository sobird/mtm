/**
 * constants
 *
 * sobird<i@sobird.me> at 2023/10/07 10:09:07 created.
 */

import { TimeRangePickerProps } from 'antd';
import moment from '@/utils/dayjs';

export const Range_Picker_Presets: TimeRangePickerProps['presets'] = [
  { label: '最近一周', value: [moment().subtract(1, 'week'), moment()] },
  { label: '最近两周', value: [moment().subtract(2, "week"), moment()] },
  { label: '最近一个月', value: [moment().subtract(1, 'month'), moment()] },
];
