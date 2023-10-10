/**
 * 使用时间组件 优惠券使用时间
 *
 * Value: [3, [20220905, 20230905]]
 * Value[0] 和 Value[1] 互斥 不能同时设值
 *
 * sobird<i@sobird.me> at 2023/09/20 3:53:49 created.
 */

import { useState } from 'react';
import { Space, Radio, DatePicker, InputNumber } from 'antd';
import type { RadioChangeEvent } from 'antd';
import type { ProFieldFC } from '@ant-design/pro-components';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

export type Value = string | number | undefined | null;
export type FieldValue = [number, [string, string]?];
export type RadioValue = 1 | 2;

export type FieldProps = {
  text: FieldValue;
};

const FieldUseTerm: ProFieldFC<FieldProps> = ({ text, mode, fieldProps, render, renderFormItem }) => {
  const { value = [], onChange, defaultValue } = fieldProps;
  const newValue = [...value] as FieldValue;
  const [day, rangePickerValue] = newValue;

  if (rangePickerValue) {
    newValue[1] = rangePickerValue?.map(item => dayjs(item));
  }

  const [radioValue, setRadioValue] = useState<RadioValue>(value[1] ? 2 : 1);
  const [fieldValue, setFieldValue] = useState<FieldValue>(newValue);

  if (mode === 'read') {
    const dom = (
      <span>{rangePickerValue ? newValue[1].map(item => item.format()).join(' 到 ') : `领取后 ${day || '-'} 天`}</span>
    );
    if (render) {
      return render(text, { mode, ...fieldProps }, dom);
    }
    return dom;
  }

  if (mode === 'edit' || mode === 'update') {
    const onRadioChange = (e: RadioChangeEvent) => {
      setRadioValue(e.target.value);
      triggerChange(e.target.value, fieldValue);
    };

    const triggerChange = (_radioValue: RadioValue, changedValue: FieldValue) => {
      const newFieldValue = [...(changedValue || [])] as FieldValue;
      const [, rangePickerValue] = newFieldValue;

      if (rangePickerValue) {
        newFieldValue[1] = rangePickerValue?.map(item => item.format('YYYY-MM-DD'));
      }

      if (_radioValue === 1) {
        newFieldValue[1] = undefined;
      } else {
        newFieldValue[0] = undefined;
      }

      onChange?.(newFieldValue);
    };

    const handleChange = (index: number, changedValue) => {
      const newFieldValue = [...(fieldValue || [])] as FieldValue;
      newFieldValue[index] = changedValue === null ? undefined : changedValue;

      setFieldValue(newFieldValue);

      triggerChange(radioValue, newFieldValue);
    };

    const { className } = fieldProps;

    const dom = (
      <Radio.Group className={className} value={radioValue} onChange={onRadioChange}>
        <Space direction='vertical' style={{ width: '100%' }}>
          <Radio value={1} style={{ width: '100%' }}>
            <Space>
              <span>领取后</span>
              <InputNumber
                style={{ width: '100%' }}
                addonAfter='天'
                min={1}
                max={30}
                value={fieldValue?.[0]}
                defaultValue={defaultValue?.[0]}
                onChange={changedValue => handleChange(0, changedValue)}
              />
            </Space>
          </Radio>

          <Radio value={2}>
            <Space>
              <span>自定义</span>
              <RangePicker
                value={fieldValue?.[1]}
                defaultValue={defaultValue?.[1]}
                onChange={changedValue => handleChange(1, changedValue)}
              />
            </Space>
          </Radio>
        </Space>
      </Radio.Group>
    );

    if (renderFormItem) {
      return renderFormItem(text, { mode, ...fieldProps }, dom);
    }

    return dom;
  }
};

export default FieldUseTerm;
