/**
 * 创建优惠券页面
 *
 * sobird<i@sobird.me> at 2023/10/07 10:58:46 created.
 */

import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Form, message } from 'antd';
import PageContainer from '@/layout/page-container';
import CouponForm from '../components/coupon-form';
import CouponService, { CouponTargetEnum } from '@/services/coupon';
import { useEffect } from 'react';

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
    title: '创建优惠券',
    path: 'create',
  },
];

const CouponCreate = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [msg, contextHolder] = message.useMessage();
  const [searchParams] = useSearchParams();
  const target = searchParams.get('target');

  // 表单初始化值
  const initialValues = {
    target: Number(target) || 1,
    displayName: 'xx ' + CouponTargetEnum[target],
  }

  useEffect(() => {
    form.resetFields();
  }, [target]);

  const onFinish = async values => {
    CouponService.create(values).then(() => {
      msg.success('创建优惠券成功', 1, () => {
        navigate(-1);
      });
    });
  };

  return (
    <PageContainer
      breadcrumb={{
        items: BreadcrumbItem,
      }}
      title='创建优惠券'
      // icon={<PlusCircleOutlined />}
      extra={[<Button onClick={() => navigate(-1)}>返回</Button>]}
    >
      {contextHolder}
      <div className='coupon-create-page'>
        <CouponForm form={form} initialValues={initialValues} onFinish={onFinish}></CouponForm>
      </div>
    </PageContainer>
  );
};

export default CouponCreate;
