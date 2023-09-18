/**
 * 优惠券满减规则 自定义表单控件
 * 
 * sobird<i@sobird.me> at 2023/09/18 21:05:33 created.
 */

import React, { ComponentProps } from "react";
import { InputNumber } from 'antd';

import './index.scss';

const InputAmountRule: React.FC<ComponentProps<typeof InputNumber>> = ({ value, onChange }) => {
  return (
    <div className="input-amount-rule">
      <label htmlFor="amount">满</label>
      <InputNumber prefix="￥" style={{ width: '100%' }} id="amount"/>

      <label htmlFor="discount">减</label>
      <InputNumber prefix="￥" style={{ width: '100%' }} id="discount"/>
    </div>
  )
}

export default InputAmountRule;
