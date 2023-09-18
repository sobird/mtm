/**
 * 优惠券详情页
 *
 * sobird<i@sobird.me> at 2023/09/16 11:12:40 created.
 */

import React, { useEffect, useState } from 'react';
import { Form, Card, Input, Spin } from 'antd';
import { ProForm, ProFormText, ProFormDateTimeRangePicker, ProFormDigit } from '@ant-design/pro-components';
import InputAmountRule from '@/components/pro/field-amount-rule';

import CouponService, { ICouponEntity, ECouponType } from '@/services/coupon';

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

  return (
    <div className='page-coupon-detail'>
      <ProForm layout="horizontal" {...formItemLayout} form={form} request={() => CouponService.detail(123)}>
        <ProFormText readonly getValueProps={(value) => {
          return {
            value: ECouponType[value]
          }
        }} width="md" name="type" label="优惠券类型" />

        <ProFormText width="lg" name="name" label="优惠券名称" placeholder="请填写优惠券名称" rules={[
          { required: true, message: '请填写优惠券名称' },
          { max: 10, message: '优惠券名称最多填写10个字' },
        ]}/>
        <Form.Item label='优惠券文案' name='displayName'>
          <InputAmountRule />
        </Form.Item>
        {/* 发放设置 */}

        <ProFormDateTimeRangePicker required width="lg" name="dateRange" label="发放时间" />
        <ProFormDigit label="发放张数" name="putCount" width="lg" min={1} max={1000000} />
      </ProForm>
    </div>
  );
};

export default CouponDetail;
