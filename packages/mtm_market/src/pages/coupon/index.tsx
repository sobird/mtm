/**
 * 商家端优惠券列表
 *
 * sobird<i@sobird.me> at 2023/09/15 21:14:09 created.
 */

import React, { useEffect, useState } from 'react';
import { Button, Table, Tag, Popconfirm, Space, Form, TimeRangePickerProps, DatePicker, Radio, Row, Col } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';

import CouponService, {
  ICouponEntity,
  ICouponPagination,
  ECouponType,
  ECouponTarget,
  ECouponStatus,
  ECouponStatusColor,
  CouponStatusOption,
} from '@/services/coupon';
import SearchForm from '@/components/search-form';
import MTable from '@/components/table';
import CreateCouponButton from './components/create-coupon-button';

const { Column } = Table;
const { RangePicker } = DatePicker;
import './index.scss';

const rangePresets: TimeRangePickerProps['presets'] = [
  { label: '最近一周', value: [dayjs().add(-7, 'd'), dayjs()] },
  { label: '最近两周', value: [dayjs().add(-14, 'd'), dayjs()] },
  { label: '最近一个月', value: [dayjs().add(-1, 'month'), dayjs()] },
];

const Coupons: React.FC = () => {
  const location = useLocation();
  const [couponPagination, setCouponPagination] = useState<ICouponPagination>();

  useEffect(() => {
    CouponService.list().then(res => {
      setCouponPagination(res);
    });
  }, [location.search]);
  return (
    <div className='page-coupons'>
      <MTable
        bordered
        title={() => {
          return (
            <Row>
              <Col flex={1}>
                <SearchForm reset submit>
                  <Form.Item
                    name='status'
                    getValueProps={value => {
                      return {
                        // 数据类型转换
                        value: Number.isInteger(Number(value)) ? Number(value) : -1,
                      };
                    }}
                  >
                    <Radio.Group
                      defaultValue={-1}
                      buttonStyle='solid'
                      options={CouponStatusOption}
                      optionType='button'
                    />
                  </Form.Item>
                  <Form.Item
                    name='term'
                    getValueFromEvent={(...[, dateString]) => {
                      return JSON.stringify(dateString);
                    }}
                    getValueProps={value => {
                      let objValue = [];
                      try {
                        objValue = JSON.parse(value);
                      } catch (err) {
                        objValue = [];
                      }
                      return {
                        value: objValue
                          ? objValue.map(item => {
                              return dayjs(item).isValid() ? dayjs(item) : undefined;
                            })
                          : undefined,
                      };
                    }}
                  >
                    <RangePicker
                      placeholder={['券发放开始时间', '券发放结束时间']}
                      showTime
                      format='YYYY-MM-DD HH:mm:ss'
                      presets={rangePresets}
                    />
                  </Form.Item>
                </SearchForm>
              </Col>
              <Col>
                <CreateCouponButton type='primary'>创建券</CreateCouponButton>
              </Col>
            </Row>
          );
        }}
        dataSource={couponPagination?.list}
        rowKey='id'
        scroll={{ x: 1400 }}
        size='middle'
        pagination={{
          total: couponPagination?.total,
        }}
        // footer={() => {
        //   return (
        //     <div>dddd</div>
        //   )
        // }}
      >
        <Column title='优惠券编码' dataIndex='id' width={120} />
        <Column<ICouponEntity>
          title='优惠券名称'
          dataIndex='name'
          render={(text, record) => {
            return <Link to={`/coupons/${record.id}`}>{text}</Link>;
          }}
        />
        <Column
          title='优惠类型'
          dataIndex='type'
          width={100}
          render={text => {
            return ECouponType[text];
          }}
        />
        <Column
          title='券类型'
          dataIndex='target'
          width={130}
          render={text => {
            return ECouponTarget[text];
          }}
        />
        <Column title='发放时间' width={120} dataIndex='stime' />
        <Column title='使用时间' width={150} dataIndex='validDays' />
        <Column title='发放数量' width={100} dataIndex='sendCount' />
        <Column title='当前余量' width={100} dataIndex='leftCount' />
        <Column title='创建时间' dataIndex='ctime' width={120} />
        <Column
          title='状态'
          dataIndex='status'
          fixed='right'
          width={80}
          render={text => {
            return <Tag color={ECouponStatusColor[text]}>{ECouponStatus[text]}</Tag>;
          }}
        />
        <Column<ICouponEntity>
          title='操作'
          dataIndex='status'
          fixed='right'
          width={150}
          render={(text, record) => {
            return (
              <Space>
                <Link to={`/coupons/${record.id}`}>查看</Link>
                {text < 2 && (
                  <Button type='link' style={{ padding: 0 }}>
                    编辑
                  </Button>
                )}
                {text < 2 && (
                  <Popconfirm
                    title='您确定要下线该优惠券吗？'
                    onConfirm={() => {
                      CouponService.delete(record.id);
                    }}
                    okText='确定'
                    cancelText='取消'
                  >
                    <Button type='link' style={{ padding: 0 }}>
                      下线
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            );
          }}
        />
      </MTable>
    </div>
  );
};

export default Coupons;
