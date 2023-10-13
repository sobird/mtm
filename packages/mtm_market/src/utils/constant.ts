/**
 * constants
 *
 * sobird<i@sobird.me> at 2023/10/07 10:09:07 created.
 */

import { TimeRangePickerProps } from 'antd';
import { Dayjs } from 'dayjs';
import dayjs from '@/utils/dayjs';

export type EventValue<DateType> = DateType | null;
export type RangeValue<DateType> = [EventValue<DateType>, EventValue<DateType>] | null;

export const Last_7_Day_Range: RangeValue<Dayjs> = [dayjs().subtract(1, 'week'), dayjs()];
export const Last_14_Day_Range: RangeValue<Dayjs> = [dayjs().subtract(2, "week"), dayjs()];
export const Last_1_Month_Range: RangeValue<Dayjs> = [dayjs().subtract(1, "month"), dayjs()];

export const Range_Picker_Presets: TimeRangePickerProps['presets'] = [
  { label: '最近一周', value: Last_7_Day_Range },
  { label: '最近两周', value: Last_14_Day_Range },
  { label: '最近一个月', value: Last_1_Month_Range },
];

