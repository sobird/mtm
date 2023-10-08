/**
 * 优惠券详情页
 *
 * sobird<i@sobird.me> at 2023/09/16 11:12:40 created.
 */

import React, { useEffect, useState } from 'react';
import { Form, Card, Input, Spin } from 'antd';
import { ProForm, ProFormText, ProFormDateTimeRangePicker, ProFormDigit, ProFormDigitRange } from '@ant-design/pro-components';
import InputAmountRule, { validator, FieldValidator } from '@/components/pro/form/AmountRule';
import ProFormUseTerm from '@/components/pro/form/UseTerm'

import CouponService, { ICouponEntity, CouponTypeMap } from '@/services/coupon';

const formItemLayout = {
  labelCol: {
    span: 4
  },
  wrapperCol: {
    span: 14
  },
};

const CouponDetail: React.FC = () => {
  const [form] = ProForm.useForm();

  const onFinish = (values, rule) => {
    form.validateFields();
    console.log('values', values, rule)
  }

  return (
    <div className='page-coupon-detail'>
      <ProForm layout="horizontal" {...formItemLayout} form={form} request={() => CouponService.detail(123)} onFinish={onFinish}>
        <ProFormText readonly getValueProps={(value) => {
          return {
            value: CouponTypeMap.get(value)
          }
        }} width="md" name="type" label="优惠券类型" />

        <ProFormText width="lg" name="name" label="优惠券名称" placeholder="请填写优惠券名称" rules={[
          { required: true, message: '请填写优惠券名称' },
          { max: 10, message: '优惠券名称最多填写10个字' },
        ]}/>
       
        {/* 发放设置 */}
        <InputAmountRule placeholder="test" readonly name="test"  label="123456" />
        <InputAmountRule fieldProps={{validator: FieldValidator}} placeholder={"12"} name="test" label="InputAmountRule" width="lg" />

        <ProFormUseTerm readonly name="useTerm" fieldProps={{b: 'b'}} label="只读模式" width="lg" />
        <ProFormUseTerm name="useTerm" fieldProps={{b: 'b'}} label="ProFormUseTerm" width="lg" />

        <ProFormDigitRange separatorWidth={40} name="name2" label="ProFormDigitRange" width="lg" required/>

        <ProFormDateTimeRangePicker required width="lg" name="dateRange" label="发放时间" />
        <ProFormDigit label="发放张数" name="putCount" width="lg" min={1} max={1000000} />
      </ProForm>
    </div>
  );
};

export default CouponDetail;
