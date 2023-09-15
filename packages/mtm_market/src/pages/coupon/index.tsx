/**
 * 商家端优惠券列表
 * 
 * sobird<i@sobird.me> at 2023/09/15 21:14:09 created.
 */

import React, { useEffect, useState } from "react";
import { Table, Tag } from 'antd';
import CouponService, { ICouponPagination, ECouponType, ECouponTarget, ECouponStatus, ECouponStatusColor } from "@/services/coupon";
const { Column, ColumnGroup } = Table;

import './index.scss';

const Coupons: React.FC = () => {
  const [couponPagination, setCouponPagination] = useState<ICouponPagination>();

  useEffect(() => {
    CouponService.list().then(res => {
      setCouponPagination(res);
    })
  }, []);
  return (
    <div className="page-coupons">
      
      <Table dataSource={couponPagination?.list} rowKey="id">
        <Column title="优惠券编码" dataIndex="id" />
        <Column title="优惠券名称" dataIndex="name" />
        <Column 
          title="优惠类型" 
          dataIndex="type" 
          render={(text) => {
            return ECouponType[text];
          }}
        />
        <Column 
          title="券类型" 
          dataIndex="target" 
          render={(text) => {
            return ECouponTarget[text];
          }}
        />
        <Column title="发放时间" dataIndex="stime" />
        <Column title="使用时间" dataIndex="validDays" />
        <Column title="发放数量" dataIndex="sendCount" />
        <Column title="当前余量" dataIndex="leftCount" />
        <Column title="创建时间" dataIndex="ctime" />
        <Column 
          title="状态" dataIndex="status" 
          render={(text) => {
            return <Tag color={ECouponStatusColor[text]}>{ECouponStatus[text]}</Tag>;
          }} />
      </Table>
    </div>
  )
};

export default Coupons;
