/**
 * 优惠券编辑页
 *
 * sobird<i@sobird.me> at 2023/10/08 21:39:11 created.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, message } from 'antd';
import { ProFormText } from '@ant-design/pro-components';

import CouponService from '@/services/coupon';
import PageContainer from '@/layout/page-container';
import CouponForm from '../components/coupon-form';

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
  {
    title: '编辑优惠券',
    path: 'update',
  },
];

const CouponUpdate: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [initialValues, setInitialValues] = useState({});

  useEffect(() => {
    CouponService.detail(params.id).then(res => {
      setInitialValues(res);
      form.resetFields();
    });
  }, []);

  const onFinish = async (values) => {
    CouponService.update(values).then(() => {
      console.log('values', values)
      messageApi.success('更新优惠券成功', 1, () => {
        navigate(-1);
      });
    });
  };

  return (
    <PageContainer
      breadcrumb={{
        items: BreadcrumbItem,
      }}
      title='编辑优惠券'
      // icon={<PlusCircleOutlined />}
      extra={[<Button onClick={() => navigate(-1)}>返回</Button>]}
    >
      {contextHolder}
      <div className='page-coupon-detail'>
        <CouponForm form={form} initialValues={initialValues} onFinish={onFinish}>
          <ProFormText hidden label='优惠券ID' width='lg' name='id' />
        </CouponForm>
      </div>
    </PageContainer>
  );
};

export default CouponUpdate;
