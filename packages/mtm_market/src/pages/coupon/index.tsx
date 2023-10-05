/**
 * 商家端优惠券列表
 * 
 * sobird<i@sobird.me> at 2023/09/15 21:14:09 created.
 */

import React, { useEffect, useState } from "react";
import { Button, Table, Tag, Popconfirm } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import CouponService, { ICouponEntity, ICouponPagination, ECouponType, ECouponTarget, ECouponStatus, ECouponStatusColor } from "@/services/coupon";
const { Column } = Table;

import './index.scss';
import useSearchParamsState from "@/hooks/useSearchParamsState";

const Coupons: React.FC = () => {
  const [couponPagination, setCouponPagination] = useState<ICouponPagination>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchParamsState, setSearchParamsState] = useSearchParamsState('test', '123');

  console.log('searchParams', searchParams);
  console.log('searchParamsState', searchParamsState)

  useEffect(() => {
    CouponService.list().then(res => {
      setCouponPagination(res);
    })
  }, []);
  return (
    <div className="page-coupons">
      
      <Table 
      bordered 
      dataSource={couponPagination?.list} 
      rowKey="id"
      scroll={{ x: 1400 }}
        pagination={{
          total: couponPagination?.total,
          current: 2,
          pageSize: 10
        }}>
        <Column title="优惠券编码" dataIndex="id" width={120} />
        <Column<ICouponEntity> title="优惠券名称" dataIndex="name" render={(text, record) => {
          return <Link to={`/coupons/${record.id}`}>{text}</Link>;
        }}/>
        <Column 
          title="优惠类型" 
          dataIndex="type"
          width={100}
          render={(text) => {
            return ECouponType[text];
          }}
        />
        <Column 
          title="券类型" 
          dataIndex="target"
          width={130}
          render={(text) => {
            return ECouponTarget[text];
          }}
        />
        <Column title="发放时间" width={120} dataIndex="stime" />
        <Column title="使用时间" width={150} dataIndex="validDays" />
        <Column title="发放数量" width={100} dataIndex="sendCount" />
        <Column title="当前余量" width={100} dataIndex="leftCount" />
        <Column title="创建时间" dataIndex="ctime" width={120}/>
        <Column 
          title="状态" 
          dataIndex="status"
          fixed='right'
          width={80}
          render={(text) => {
            return <Tag color={ECouponStatusColor[text]}>{ECouponStatus[text]}</Tag>;
          }} />
        <Column<ICouponEntity> 
          title="操作"
          dataIndex="status"
          fixed='right'
          width={150}
          render={(text, record) => {
            return (
              <>
                <Link to={`/coupons/${record.id}`}>查看</Link>
                { text < 2 && <Button type="link" size="small">编辑</Button>}
                { text < 2 && <Popconfirm
                  title="您确定要下线该优惠券吗？"
                  onConfirm={() => {
                    setSearchParams({a: '123'})
                    setSearchParamsState('456')
                    CouponService.delete(record.id);
                  }}
                  okText="确定"
                  cancelText="取消">
                  <Button type="link" size="small">下线</Button>
                </Popconfirm>}
              </>
            );
          }} />
      </Table>
    </div>
  )
};

export default Coupons;
