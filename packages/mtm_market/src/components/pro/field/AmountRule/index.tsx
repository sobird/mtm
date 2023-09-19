/**
 * 优惠券满减规则 自定义表单控件 跟业务耦合
 * 
 * sobird<i@sobird.me> at 2023/09/18 21:05:33 created.
 */

import React, { useState } from 'react';
import { InputNumber, Space, Form } from 'antd';
import type { ProFieldFC } from '@ant-design/pro-components';
import useMergedState from 'rc-util/lib/hooks/useMergedState';
type ValidateStatus = Parameters<typeof Form.Item>[0]['validateStatus'];
// 兼容代码-----------
import 'antd/lib/input-number/style';

export type Value = string | number | undefined | null;

export type ValuePair = Value[];

export type FieldAmountRuleProps = {
  text: ValuePair;
  placeholder?: string | string[];
  separatorWidth?: number;
};

/**
 * 优惠券满减规则组件
 *
 * @param FieldAmountRuleProps
 */
const FieldAmountRule: ProFieldFC<FieldAmountRuleProps> = (
  {
    text,
    mode,
    render,
    placeholder,
    renderFormItem,
    fieldProps,
  },
  ref,
) => {
  const { value, defaultValue, onChange, id, validator = [] } = fieldProps;

  const [validate, setValidate] = useState([]);

  const [valuePair, setValuePair] = useMergedState(() => defaultValue, {
    value,
    onChange,
  });

  if (mode === 'read') {
    const dom = (
      <span ref={ref}>
        满{text[0]}减{text[1]}
      </span>
    );
    if (render) {
      return render(text, { mode, ...fieldProps }, dom);
    }
    return dom;
  }

  if (mode === 'edit' || mode === 'update') {
    const handleGroupBlur = () => {
      if (Array.isArray(valuePair)) {
        //   仅在两个值均为数字时才做比较并转换
        const [value0, value1] = valuePair;
        if (
          typeof value0 === 'number' &&
          typeof value1 === 'number' &&
          value0 > value1
        ) {
          setValuePair([value1, value0]);
        } else if (value0 === undefined && value1 === undefined) {
          // 当两个值均为undefined时将值变为undefined，方便required处理
          setValuePair(undefined);
        }
      }
    };

    const handleChange = (index: number, changedValue: Value) => {
      const newValuePair = [...(valuePair || [])];
      newValuePair[index] = changedValue === null ? undefined : changedValue;
      setValuePair(newValuePair);

      validate[index] = {...validator[index]?.(newValuePair)};
      setValidate(validate);
    };

    const placeholderValue = fieldProps?.placeholder ||
      placeholder || [
      '请输入满减门槛',
      '请输入优惠金额',
    ];

    const getInputNumberPlaceholder = (index: number) =>
      Array.isArray(placeholderValue)
        ? placeholderValue[index]
        : placeholderValue;

    const { className, ...restFieldProps } = fieldProps;

    const dom = (
      <Space size={10} 
        // onBlur={handleGroupBlur} 
        className={className}>
        <Form.Item
          label="满"
          htmlFor={`${id}-0`}
          validateStatus={validate[0]?.status}
          help={validate[0]?.help}
        >
          <InputNumber
            style={{width: '100%'}}
            prefix="￥"
            min={0}
            max={5000}
            {...restFieldProps}
            placeholder={getInputNumberPlaceholder(0)}
            id={`${id}-0`}
            value={valuePair?.[0]}
            defaultValue={defaultValue?.[0]}
            onChange={(changedValue) => handleChange(0, changedValue)}
          />
        </Form.Item>

        <Form.Item
          label="减"
          htmlFor={`${id}-1`}
          validateStatus={validate[1]?.status}
          help={validate[1]?.help}
        >
          <InputNumber
            prefix="￥"
            style={{width: '100%'}}
            min={0}
            max={5000}
            {...restFieldProps}
            placeholder={getInputNumberPlaceholder(1)}
            id={`${id}-1`}
            value={valuePair?.[1]}
            defaultValue={defaultValue?.[1]}
            onChange={(changedValue) => handleChange(1, changedValue)}
          />
        </Form.Item>
      
        {/* <label htmlFor={`${id}-0`}>满</label>
        <InputNumber<number>
          prefix="￥"
          style={{width: '100%'}}
          min={0}
          {...restFieldProps}
          placeholder={getInputNumberPlaceholder(0)}
          id={`${id}-0`}
          value={valuePair?.[0]}
          defaultValue={defaultValue?.[0]}
          onChange={(changedValue) => handleChange(0, changedValue)}
        />
        <label htmlFor={`${id}-1`}>减</label>
        <InputNumber<number>
          prefix="￥"
          style={{width: '100%'}}
          min={0}
          {...restFieldProps}
          placeholder={getInputNumberPlaceholder(1)}
          id={`${id}-1`}
          value={valuePair?.[1]}
          defaultValue={defaultValue?.[1]}
          onChange={(changedValue) => handleChange(1, changedValue)}
        /> */}
      </Space>
    );

    if (renderFormItem) {
      return renderFormItem(text, { mode, ...fieldProps }, dom);
    }
    
    return dom;
  }
  return null;
};

/** 预置表单校验器 根据具体业务自定 */
export const validator = async (rule, value: ValuePair) => {
  const [amount, discount] = value
  
  if (!amount && amount !== 0) {
    throw new Error('请输入满减门槛');
  }

  if (!discount && discount !== 0) {
    throw new Error('请输入优惠金额');
  }
};

export const FieldValidator = [(value: ValuePair) => {
  const [amount, discount] = value
  if (!amount && amount !== 0) {
    return {
      status: 'error',
      help: '请输入满减门槛'
    }
  }

  
}, (value: ValuePair) => {
  const [amount, discount] = value
  if (!discount && discount !== 0) {
    return {
      status: 'error',
      help: '请输入优惠金额'
    }
  }
  if (discount as number < 0.01) {
    return {
      status: 'error',
      help: '面额最小值是0.01元'
    }
  }

  if (amount === 0) {
    if (discount as number > 500) {
      return {
        status: 'error',
        help: '门槛为0时，面额需小于等于500元'
      }
    } else {
      if (discount as number > 10) {
        // Message.warning('您正在配置无门槛且面额大于10元的优惠券，请确认是否配置正确');
      }
    }
  } 
}];

export default React.forwardRef(FieldAmountRule);
