/**
 * 优惠券公共字段组件
 *
 * sobird<i@sobird.me> at 2023/10/08 19:54:11 created.
 */
import React, { PropsWithChildren, ComponentProps } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Space } from 'antd';
import {
  ProForm,
  ProFormText,
  ProFormDateTimeRangePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormProps,
} from '@ant-design/pro-components';
import ProFormCouponRule, { FieldValidator } from '@/components/pro/form/AmountRule';
import ProFormUseTerm from '@/components/pro/form/UseTerm';
import { CouponTargetMap, CouponLimitCountMap } from '@/services/coupon';

interface CouponFormProps extends ProFormProps {
  mode?: 'create' | 'update' | 'detail';
}

const formItemLayout = {
  labelCol: {
    flex: '0 0 110px',
  },
};

const CouponForm: React.FC<PropsWithChildren<CouponFormProps>> = ({ children, mode, ...props }) => {
  const [, setSearchParams] = useSearchParams();
  return (
    <ProForm
      colon={false}
      layout='horizontal'
      {...formItemLayout}
      submitter={{
        render: (_, doms) => {
          return <Space style={{ marginLeft: 110 }}>{doms}</Space>;
        },
      }}
      {...props}
    >
      <ProFormSelect
        name='target'
        label='优惠券类型'
        valueEnum={CouponTargetMap}
        placeholder='请选择'
        width='lg'
        allowClear={false}
        // 编辑态 不可用
        disabled={mode && mode === 'update'}
        onChange={(target: string) => {
          setSearchParams(
            prev => {
              prev.set('target', target);
              return prev;
            },
            {
              replace: true,
            }
          );
        }}
      />
      {/* <ProFormText
        readonly
        getValueProps={value => {
          return {
            value: CouponTargetEnum[value],
          };
        }}
        width='md'
        name='target'
        label='优惠券类型'
      /> */}

      <ProFormText
        width='lg'
        name='name'
        label='优惠券名称'
        placeholder='请填写优惠券名称'
        rules={[
          { required: true, message: '请填写优惠券名称' },
          { max: 10, message: '优惠券名称最多填写10个字' },
        ]}
      />
      <ProFormText name='displayName' label='优惠券文案' disabled width='lg' />

      {/* 发放设置 */}
      <ProFormDateTimeRangePicker
        required
        width='lg'
        name='putTerm'
        label='发放时间'
        rules={[{ required: true, message: '请选择发放时间' }]}
      />
      <ProFormDigit
        label='发放张数'
        name='stock'
        placeholder='请输入1-1,000,000的正整数'
        width='lg'
        min={1}
        max={1000000}
        rules={[{ required: true, message: '请填写发放张数' }]}
      />
      <ProFormCouponRule
        fieldProps={{ validator: FieldValidator }}
        placeholder={['请输入门槛', '请输入面额']}
        name='rule'
        label='门槛及面额'
        width='lg'
        rules={[{ required: true, message: '请填写门槛及面额' }]}
      />
      <ProFormSelect
        name='limit'
        label='每人限领张数'
        valueEnum={CouponLimitCountMap}
        placeholder='请选择'
        width='lg'
        rules={[{ required: true, message: '请选择每人限领张数' }]}
      />
      <ProFormUseTerm name='useTerm' label='使用时间' width='lg' required />
      {children}
    </ProForm>
  );
};

export default CouponForm;
