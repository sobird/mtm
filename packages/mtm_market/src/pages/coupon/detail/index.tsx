/**
 * 优惠券详情页
 *
 * sobird<i@sobird.me> at 2023/09/16 11:12:40 created.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button } from 'antd';
import { ProFormDatePicker } from '@ant-design/pro-components';
import { EditOutlined } from '@ant-design/icons';

import CouponService, { ICouponEntity, isEdit } from '@/services/coupon';
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
    title: '优惠券详情',
    path: 'detail',
  },
];

const CouponDetail: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [formData, setFormData] = useState<Partial<ICouponEntity>>();

  useEffect(() => {
    CouponService.detail(params.id).then(res => {
      form.setFieldsValue(res);
      setFormData(res);
    });
  }, []);

  // 根据状态判断是否展示编辑按钮
  const EditButton = isEdit(formData?.status) ? (
    <Button type='primary' icon={<EditOutlined />} onClick={() => navigate(`/coupon/update/${params.id}`)}>
      编辑
    </Button>
  ) : null;

  return (
    <PageContainer
      breadcrumb={{
        items: BreadcrumbItem,
      }}
      title='优惠券详情'
      // icon={<PlusCircleOutlined />}
      extra={[<Button onClick={() => navigate(-1)}>返回</Button>, EditButton]}
    >
      <div className='page-coupon-detail'>
        <CouponForm form={form} submitter={false} disabled>
          <ProFormDatePicker label='创建日期' width='lg' name='ctime' />
        </CouponForm>
      </div>
    </PageContainer>
  );
};

export default CouponDetail;
