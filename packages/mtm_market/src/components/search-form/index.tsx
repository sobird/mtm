/**
 * 高级搜索表单
 *
 * sobird<i@sobird.me> at 2023/10/05 20:48:29 created.
 */
import React, { useEffect, PropsWithChildren } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Form, FormProps } from 'antd';

interface SearchFormProps<Values> extends FormProps {
  beforeInitialValues?: (val: URLSearchParams) => URLSearchParams;
  beforeValuesChange?: (val: Values) => Values;
  reset?: boolean;
  submit?: boolean;
}

const SearchForm: React.FC<PropsWithChildren<SearchFormProps<any>>> = ({
  beforeValuesChange,
  beforeInitialValues,
  children,
  reset,
  submit,
  ...props
}) => {
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useSearchParams();

  // 初始化表单值
  useEffect(() => {
    const newURLSearch = beforeInitialValues?.(searchParams) ?? searchParams;
    form.setFieldsValue(Object.fromEntries(newURLSearch.entries()));
  }, []);

  const onValuesChange = changedValues => {
    const newValues = beforeValuesChange?.(changedValues) ?? changedValues;

    setTimeout(() => {
      setSearchParams(prev => {
        return {
          ...Object.fromEntries(prev.entries()),
          ...newValues,
        };
      });
    }, 100);
  };

  if(!submit) {
    props.onValuesChange = onValuesChange;
  }

  return (
    <Form layout='inline' form={form} onFinish={(values) => onValuesChange(values)} {...props}>
      {children}
      {submit ? (
        <Form.Item>
          <Button type='primary' htmlType='submit'>
            查询
          </Button>
        </Form.Item>
      ) : null}
      {reset ? (
        <Form.Item>
          <Button
            onClick={() => {
              form.resetFields();
              onValuesChange(form.getFieldsValue());
            }}
          >
            重置
          </Button>
        </Form.Item>
      ) : null}
    </Form>
  );
};

export default SearchForm;
