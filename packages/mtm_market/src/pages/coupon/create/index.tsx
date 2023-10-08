/**
 * 创建优惠券页面
 *
 * sobird<i@sobird.me> at 2023/10/07 10:58:46 created.
 */

import { useParams, useSearchParams } from 'react-router-dom';
import { Button, Space } from 'antd';
import {
  ProForm,
  ProFormText,
  ProFormDateTimeRangePicker,
  ProFormDigit,
  ProFormDigitRange,
  FooterToolbar,
  ProFormSelect,
} from '@ant-design/pro-components';
import { PlusCircleOutlined } from '@ant-design/icons';
import PageContainer from '@/layout/page-container';
import InputAmountRule, { validator, FieldValidator } from '@/components/pro/form/AmountRule';
import ProFormUseTerm from '@/components/pro/form/UseTerm';
import CouponService, { ICouponEntity, CouponTargetEnum, CouponLimitCountMap } from '@/services/coupon';

const formItemLayout = {
  labelCol: {
    flex: '0 0 110px',
  },
};

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
  const [form] = ProForm.useForm();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const target = searchParams.get('target');
  console.log('params', params, target);

  const onFinish = async values => {
    // form.validateFields();
    console.log('values', values);
  };

  return (
    <PageContainer
      breadcrumb={{
        items: BreadcrumbItem,
      }}
      title='创建优惠券'
      // icon={<PlusCircleOutlined />}
      extra={[<Button>返回</Button>]}
    >
      <div className='coupon-create-page'>
        <ProForm
          layout='horizontal'
          {...formItemLayout}
          form={form}
          initialValues={{
            target,
            displayName: 'xx ' + CouponTargetEnum[target],
          }}
          onFinish={onFinish}
          submitter={{
            render: (_, dom) => <Space style={{ marginLeft: 110 }}>{dom}</Space>,
          }}
        >
          <ProFormText
            readonly
            getValueProps={value => {
              return {
                value: CouponTargetEnum[value],
              };
            }}
            width='md'
            name='target'
            label='优惠券类型'
          />

          <ProFormText
            width='lg'
            name='name'
            label='优惠券名称'
            placeholder='请填写优惠券名称'
            rules={[
              { required: true, message: '请填写优惠券名称' },
              { max: 10, message: '优惠券名称最多填写10个字' },
            ]}
          />
          <ProFormText
            readonly
            width='md'
            name='displayName'
            label='优惠券文案'
          />

          {/* 发放设置 */}
          <ProFormDateTimeRangePicker label='发放时间' disabled required width='lg' name='dateRange' />
          <ProFormDateTimeRangePicker
            required
            width='lg'
            name='putTerm'
            label='发放时间'
            rules={[{ required: true, message: '请选择发放时间' }]}
          />
          <ProFormDigit
            label='发放张数'
            name='putCount'
            placeholder='请输入1-1,000,000的正整数'
            width='sm'
            min={1}
            max={1000000}
            rules={[{ required: true, message: '请填写发放张数' }]}
          />
          <InputAmountRule
            fieldProps={{ validator: FieldValidator }}
            placeholder={'请输入门槛及面额'}
            name='test'
            label='门槛及面额'
            width='lg'
            rules={[{ required: true, message: '请填写门槛及面额' }]}
          />
          <ProFormSelect
            name='limitCount'
            label='每人限领张数'
            valueEnum={CouponLimitCountMap}
            placeholder='请选择'
            width='sm'
            rules={[{ required: true, message: '请选择每人限领张数' }]}
          />
          <ProFormUseTerm name='useTerm' label='使用时间' width='lg' required />
        </ProForm>
      </div>
    </PageContainer>
  );
};

export default CouponCreate;
