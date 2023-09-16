/**
 * 优惠券详情页
 * 
 * sobird<i@sobird.me> at 2023/09/16 11:12:40 created.
 */

import React from "react";
import { Form, Card, Input } from "antd";


const FormLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 10 },
};

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
};

const CouponDetail: React.FC = () => {
  return (
    <div className="page-coupon-detail">
      123
      <Form {...formItemLayout}>
        <Card title="基本信息" bordered={false}>
          <Form.Item
            label="优惠券类型"
            name="type">
            请填写优惠券名称
          </Form.Item>
          <Form.Item
            label="优惠券名称"
            name="name"
            rules={[
              { required: true, message: '请填写优惠券名称' },
              { max: 10, message: '优惠券名称最多填写10个字' }
            ]}>
            <Input placeholder="请填写优惠券名称" />
          </Form.Item>
          <Form.Item
            label="券文案"
            name="displayName">
            请填写优惠券名称
          </Form.Item>
        </Card>
      </Form>
    </div>
  )
}

export default CouponDetail;
