/**
 * 日期期限选择
 * 
 * [0, '2023-8-8', '2033-8-8']
 * 
 * sobird<i@sobird.me> at 2023/08/19 2:00:08 created.
 */

import React, { useState } from "react";
import { Checkbox, DatePicker } from "antd";
import dayjs, { Dayjs } from 'dayjs';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';

const { RangePicker } = DatePicker;

type TermPickValue = [boolean?, (string | Dayjs)?, (string | Dayjs)?];

interface TermPickProps {
  rangePicker?: boolean;
  value?: TermPickValue;
  onChange?: (value: TermPickValue) => void;
  format?: string;
}

const TermPick: React.FC<TermPickProps> = ({ value = [false], onChange, format = 'YYYY-MM-DD', rangePicker, ...DatePickerProps }) => {
  const [checked, setChecked] = useState(false);
  const [picker, setPicker] = useState([]);
  const [checkedValue, ...pickerValue] = value;

  const onCheckboxChange = (e: CheckboxChangeEvent) => {
    const newValue = e.target.checked;
    setChecked(newValue);

    value[0] = newValue;
    onChange?.(value);
  };

  const onDatePickerChange = (e) => {
    if(!rangePicker) {
      e = [e];
    }
    setPicker(e);

    e.forEach((item: Dayjs, index) => {
      value[index+1] = format ? item.format(format) : item;
    });
    onChange?.(value);
  }

  return (
    <>
      {rangePicker ? <RangePicker disabled={checked} value={pickerValue.map(item => dayjs(item)) || picker} format={format} {...DatePickerProps} onChange={onDatePickerChange}/> : <DatePicker disabled={checked} format={format} {...DatePickerProps} onChange={onDatePickerChange}/>}
      <Checkbox checked={ checkedValue || checked } onChange={onCheckboxChange} style={{marginLeft: '10px'}}>长期有效</Checkbox>
    </>
  )
};

export default TermPick;
