/**
 * 商家端优惠券列表
 *
 * sobird<i@sobird.me> at 2023/09/15 21:14:09 created.
 */

import React, { useEffect, useState } from 'react';
import { Button, Table, Tag, Popconfirm, Space, Form, DatePicker, Radio, Row, Col, Badge } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import dayjs from '@/utils/dayjs';
import CouponService, {
  ICouponEntity,
  ICouponPagination,
  CouponTypeMap,
  CouponTargetEnum,
  CouponStatusEnum,
  CouponStatusMap,
  CouponStatusColorMap,
} from '@/services/coupon';
import { Range_Picker_Presets } from '@/utils/constant';
import SearchForm from '@/components/search-form';
import MTable from '@/components/table';
import CreateCouponEntry from './components/create-coupon-entry';
import PageContainer from '@/layout/page-container';
const { Column } = Table;
const { RangePicker } = DatePicker;

import './index.scss';

const BreadcrumbItem = [
  {
    title: '首页',
    href: '/',
  },
  {
    title: '营销中心',
    path: '/',
  },
  {
    title: '优惠券',
    path: 'coupons',
  },
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
    <PageContainer
      breadcrumb={{
        items: BreadcrumbItem,
      }}
      title='优惠券'
      icon='coupon'
      description='高级表单常见于一次性输入和提交大批量数据的场景。'
      extra={[<CreateCouponEntry icon={<PlusCircleOutlined />}>创建优惠券</CreateCouponEntry>]}
    >
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
                        options={[...CouponStatusMap].map(item => ({
                          value: item[0],
                          label: item[1],
                        }))}
                        optionType='button'
                      />
                    </Form.Item>
                    <Form.Item
                      name='term'
                      getValueFromEvent={(...[, dateString]) => {
                        return JSON.stringify(dateString);
                      }}
                      getValueProps={originValue => {
                        let value = [];
                        try {
                          value = JSON.parse(originValue);
                        } catch (err) {
                          value = [];
                        }
                        return {
                          value: value
                            ? value.map(item => {
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
                        presets={Range_Picker_Presets}
                      />
                    </Form.Item>
                  </SearchForm>
                </Col>
                <Col></Col>
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
        >
          <Column title='优惠券编码' dataIndex='id' width={100} />
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
            width={80}
            render={text => {
              return CouponTypeMap.get(text);
            }}
          />
          <Column
            title='券类型'
            dataIndex='target'
            width={120}
            render={text => {
              return CouponTargetEnum[text];
            }}
          />
          <Column title='发放时段' width={180} dataIndex='putTerm' />
          <Column title='使用时间' width={150} dataIndex='validDays' />
          <Column title='发放数量' width={100} dataIndex='sendCount' />
          <Column title='当前余量' width={100} dataIndex='leftCount' />
          <Column title='创建时间' dataIndex='ctimeLabel' width={160} />
          <Column
            title='状态'
            dataIndex='status'
            fixed='right'
            width={80}
            render={text => {
              return <Badge color={CouponStatusColorMap.get(text)} status={text === CouponStatusEnum.进行中 ? "processing" : "default"} text={CouponStatusMap.get(text)} />
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
    </PageContainer>
  );
};

export default Coupons;
