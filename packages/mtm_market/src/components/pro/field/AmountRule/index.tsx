/**
 * 优惠券满减规则 自定义表单控件
 * 
 * sobird<i@sobird.me> at 2023/09/18 21:05:33 created.
 */

// import React, { ComponentProps } from "react";
// import { InputNumber } from 'antd';

// import './index.scss';

// const InputAmountRule: React.FC<ComponentProps<typeof InputNumber>> = ({ value, onChange }) => {
//   return (
//     <div className="input-amount-rule">
//       <label htmlFor="amount">满</label>
//       <InputNumber prefix="￥" style={{ width: '100%' }} id="amount"/>

//       <label htmlFor="discount">减</label>
//       <InputNumber prefix="￥" style={{ width: '100%' }} id="discount"/>
//     </div>
//   )
// }

// export default InputAmountRule;

import React from 'react';
import { InputNumber, Space } from 'antd';
import { useIntl } from '@ant-design/pro-provider';
import type { ProFieldFC } from '@ant-design/pro-components';
import useMergedState from 'rc-util/lib/hooks/useMergedState';

// 兼容代码-----------
import 'antd/lib/input-number/style';
//----------------------

export type Value = string | number | undefined | null;

export type ValuePair = Value[];

export type FieldAmountRuleProps = {
  text: ValuePair;
  placeholder?: string | string[];
  separator?: string;
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
    mode: type,
    render,
    placeholder,
    renderFormItem,
    fieldProps,
    separator = '~',
  },
  ref,
) => {
  const { value, defaultValue, onChange, id } = fieldProps;
  const intl = useIntl();

  const [valuePair, setValuePair] = useMergedState(() => defaultValue, {
    value: value,
    onChange: onChange,
  });

  if (type === 'read') {
    const getContent = (number: Value) => {
      const digit = new Intl.NumberFormat(undefined, {
        minimumSignificantDigits: 2,
        ...(fieldProps?.intlProps || {}),
      }).format(Number(number) as number);

      return fieldProps?.formatter?.(digit) || digit;
    };
    const dom = (
      <span ref={ref}>
        满 {getContent(text[0])} 减 {getContent(text[1])}
      </span>
    );
    if (render) {
      return render(text, { mode: type, ...fieldProps }, dom);
    }
    return dom;
  }

  if (type === 'edit' || type === 'update') {
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
    };

    const placeholderValue = fieldProps?.placeholder ||
      placeholder || [
      intl.getMessage('tableForm.inputPlaceholder', '请输入'),
      intl.getMessage('tableForm.inputPlaceholder', '请输入'),
    ];

    const getInputNumberPlaceholder = (index: number) =>
      Array.isArray(placeholderValue)
        ? placeholderValue[index]
        : placeholderValue;

    const { className, ...restFieldProps } = fieldProps;

    console.log('restFieldProps', placeholderValue)

    const dom = (
      <Space size={10} onBlur={handleGroupBlur} className={className}>
        <label htmlFor={`${id}-0`}>满</label>
        <InputNumber<number>
          prefix="￥"
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
          {...restFieldProps}
          placeholder={getInputNumberPlaceholder(1)}
          id={`${id}-1`}
          value={valuePair?.[1]}
          defaultValue={defaultValue?.[1]}
          onChange={(changedValue) => handleChange(1, changedValue)}
        />
      </Space>
    );

    if (renderFormItem) {
      return renderFormItem(text, { mode: type, ...fieldProps }, dom);
    }
    
    return dom;
  }
  return null;
};

export default React.forwardRef(FieldAmountRule);
