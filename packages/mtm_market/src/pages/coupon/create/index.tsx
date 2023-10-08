/**
 * 创建优惠券页面
 *
 * sobird<i@sobird.me> at 2023/10/07 10:58:46 created.
 */

import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from 'antd';
import {
  ProForm,
  ProFormText,
  ProFormDateTimeRangePicker,
  ProFormDigit,
  ProFormDigitRange,
} from '@ant-design/pro-components';
import { PlusCircleOutlined } from '@ant-design/icons';
import PageContainer from '@/layout/page-container';
import InputAmountRule, { validator, FieldValidator } from '@/components/pro/form/AmountRule';
import ProFormUseTerm from '@/components/pro/form/UseTerm';
import CouponService, { ICouponEntity, ECouponTarget } from '@/services/coupon';

const formItemLayout = {
  labelCol: {
    flex: "0 0 100px"
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

  const onFinish = async (values) => {
    form.validateFields();
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
          onFinish={onFinish}
        >
          <ProFormText
            readonly
            initialValue={target}
            getValueProps={value => {
              return {
                value: ECouponTarget[value],
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

          {/* 发放设置 */}
          <InputAmountRule
            fieldProps={{ validator: FieldValidator }}
            placeholder={'请输入门槛及面额'}
            name='test'
            label='门槛及面额'
            width='lg'
          />

          <ProFormUseTerm readonly name='useTerm' fieldProps={{ b: 'b' }} label='只读模式' width='lg' />
          <ProFormUseTerm name='useTerm' fieldProps={{ b: 'b' }} label='ProFormUseTerm' width='lg' />

          <ProFormDigitRange separatorWidth={40} name='name2' label='ProFormDigitRange' width='lg' required />

          <ProFormDateTimeRangePicker required width='lg' name='dateRange' label='发放时间' />
          <ProFormDigit label='发放张数' name='putCount' width='lg' min={1} max={1000000} />
        </ProForm>
      </div>
    </PageContainer>
  );
};

export default CouponCreate;
