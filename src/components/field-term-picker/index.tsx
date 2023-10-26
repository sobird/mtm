/**
 * 日期期限选择
 *
 * @value [0, '2023-8-8', '2033-8-8'] [长期有效, 开始时间, 结束时间]
 * @todo
 *
 * sobird<i@sobird.me> at 2023/08/19 2:00:08 created.
 */

import React, { useState } from 'react';
import useMergedState from 'rc-util/lib/hooks/useMergedState';
import { Checkbox, DatePicker, Space } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import type { RangePickerProps } from 'antd/es/date-picker';

const { RangePicker } = DatePicker;

type FieldTermPickValue = [boolean?, (string | Dayjs)?, (string | Dayjs)?];

interface FieldTermPickProps {
  value?: FieldTermPickValue;
  defaultValue?: FieldTermPickValue;
  onChange?: (value: FieldTermPickValue) => void;
  rangePicker?: boolean;
  format?: string;
}

const FieldTermPick: React.FC<FieldTermPickProps> = ({
  value = [false],
  defaultValue = [],
  onChange,
  format = 'YYYY-MM-DD',
  rangePicker,
  ...DatePickerProps
}) => {
  const [valuePair, setValuePair] = useMergedState(() => defaultValue, {
    value,
    onChange,
  });

  const [checkedValue, ...pickerValue] = valuePair;
  const _pickerValue = pickerValue.map(item => dayjs(item)) as unknown as RangePickerProps["value"];

  const onCheckboxChange = (e: CheckboxChangeEvent) => {
    const newValue = e.target.checked;

    valuePair[0] = newValue;
    setValuePair([...valuePair]);
  };

  const onDatePickerChange = (day: any) => {
    if (!rangePicker && day) {
      day = [day];
    }

    const pickerValue: any[] = day?.map((item: Dayjs) => {
      return format ? item?.format(format) : item;
    }) || [];
    setValuePair([valuePair[0], ...pickerValue] as unknown as FieldTermPickValue);
  };

  return (
    <Space className="field-term-picker">
      {rangePicker ? (
        <RangePicker
          disabled={checkedValue}
          value={_pickerValue}
          format={format}
          {...DatePickerProps}
          onChange={onDatePickerChange}
        />
      ) : (
        <DatePicker value={_pickerValue[0]} disabled={checkedValue} format={format} {...DatePickerProps} onChange={onDatePickerChange} />
      )}
      <Checkbox checked={checkedValue} onChange={onCheckboxChange}>
        长期有效
      </Checkbox>
    </Space>
  );
};

export default FieldTermPick;
