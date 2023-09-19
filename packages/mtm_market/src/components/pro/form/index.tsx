import React from 'react';
import type { InputProps } from 'antd';
import type { InputRef } from 'antd/lib/input';
import type { ProFormFieldItemProps } from '@ant-design/pro-form/es/typing';
import ProField from '@ant-design/pro-form/es/components/Field';

export const WrappedProFormField = (ProFieldComponent: React.ElementType, valueType?: string) => {
  const ProFormFiels: React.FC<ProFormFieldItemProps<InputProps, InputRef>> = ({
    fieldProps,
    proFieldProps,
    ...rest
  }: ProFormFieldItemProps<InputProps, InputRef>) => {
    return (
      <ProField
        valueType={valueType}
        render={(text: any, fieldProps: any) => {
          const { mode } = fieldProps;
          return <ProFieldComponent text={text} mode={mode} fieldProps={fieldProps} />;
        }}
        renderFormItem={(text: any, fieldProps: any) => {
          const { mode } = fieldProps;
          fieldProps.test = 123;
          return <ProFieldComponent text={text} mode={mode} fieldProps={fieldProps} />;
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
  
  return ProFormFiels;
};
