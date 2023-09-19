import React from 'react';
import type { InputProps } from 'antd';
import type { InputRef } from 'antd/lib/input';
import type { ProFormFieldItemProps } from '@ant-design/pro-form/es/typing';
import ProField from '@ant-design/pro-form/es/components/Field';

import FieldAmountRule from '@/components/pro/field/AmountRule'

const valueType = 'AmountRule' as const;
/**
 * 文本组件
 *
 * @param
 */
const ProFormAmountRule: React.FC<ProFormFieldItemProps<InputProps, InputRef>> = ({
  fieldProps,
  proFieldProps,
  ...rest
}: ProFormFieldItemProps<InputProps, InputRef>) => {
  return (
    <ProField
      valueType={valueType}
      render={(text: any, fieldProps: any) => {
        const { mode } = fieldProps;
        return <FieldAmountRule text={text} mode={mode} fieldProps={fieldProps} />
      }}
      renderFormItem={(text: any, fieldProps: any) => {
        const { mode } = fieldProps;
        console.log('renderFormItem', fieldProps)
        return <FieldAmountRule text={text} mode={mode} fieldProps={fieldProps} />
      }}
      fieldProps={fieldProps}
      // filedConfig={
      //   {
      //     valueType,
      //   } as const
      // }
      proFieldProps={proFieldProps}
      {...rest}
    />
  );
};

const WrappedProFormAmountRule: typeof ProFormAmountRule  = ProFormAmountRule as any;

WrappedProFormAmountRule.displayName = 'ProFormComponent';
export default WrappedProFormAmountRule;
