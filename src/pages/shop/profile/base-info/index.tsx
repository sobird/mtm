/**
 * 店铺基本信息
 *
 * sobird<i@sobird.me> at 2023/10/25 19:32:29 created.
 */

import React, { useEffect, useState } from 'react';
import { Form, Button, Input, Space } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/store/hooks';
import FieldMerchantLogo from '@/components/field-merchant-logo';
import MerchantService,  { getCategoryPath, MerchantTypeEnum } from '@/services/merchant';
import BaseAdmin from '@/pages/shop/admin/form';
import { Card } from '@mtm/shared';
import ShopContact from '../../contact';

import './index.scss';

const blankText = '暂未填写';

const value = '';

const formItemLayout = {
  labelCol: {
    flex: '0 0 142px',
  },
};

function BaseInfo() {
  const [form] = Form.useForm();
  const merchant = useAppSelector(state => state.merchant);
  const {
    shopInfo: { id, name, description, type, logo, category, externalLink },
  } = merchant;

  const initialValues = {
    shopId: id,
    shopName: name,
    shopTypeLabel: MerchantTypeEnum[type],
    description,
    logo: [logo],
    category,
    type,
    externalLink,
  };


  useEffect(() => {
    MerchantService.category().then(res => {
      const categoryPath = getCategoryPath(category, res);
      const categoryPathName = categoryPath.map(item => item.name);
      const categoryLabel = categoryPathName.join(' > ');
      console.log('categoryLabel', categoryLabel)
      form.setFieldValue('categoryLabel', categoryLabel);
    }) 
  }, []);

  return (
    <div className='shop-baseinfo-panel'>
      <Card title="基础信息" bodyStyle={{paddingTop: 20}}>
        <Form
          className='shop-base-form'
          {...formItemLayout}
          initialValues={initialValues}
          form={form}
          onFinish={values => {
            console.log('values', values);
          // todo 
          }}
        >
          <Form.Item label='店铺编号' shouldUpdate={(pre, cur) => pre.shopId !== cur.shopId}>
            {({ getFieldValue }) => {
              const shopId = getFieldValue('shopId');
              return (
                <>
                  {shopId} <CopyOutlined className='clipboard' data-clipboard-text={shopId} />
                </>
              );
            }}
          </Form.Item>

          <Form.Item label='店铺名称' shouldUpdate={(p, c) => p.shopName !== c.shopName}>
            {({ getFieldValue }) => {
              const shopName = getFieldValue('shopName');
              return <>{shopName}</>;
            }}
          </Form.Item>

          <Form.Item label='店铺类型' shouldUpdate={(p, c) => p.shopTypeLabel !== c.shopTypeLabel}>
            {({ getFieldValue }) => {
              const shopTypeLabel = getFieldValue('shopTypeLabel');
              return <>{shopTypeLabel}</>;
            }}
          </Form.Item>

          <Form.Item label='主营类目' shouldUpdate={(p, c) => p.categoryLabel !== c.categoryLabel}>
            {({ getFieldValue }) => {
              const categoryLabel = getFieldValue('categoryLabel');
              return <>{categoryLabel}</>;
            }}
          </Form.Item>

          <Form.Item
            label='店铺标志'
            name='logo'
            required
            rules={[
              {
                required: true,
                message: '请上传店铺logo',
              },
              {
                validator: async (rule, value) => {
                  if (value[0] === value[1]) {
                    throw new Error('不能与生效中的店铺标志图相同，请重新上传');
                  }
                },
              },
            ]}
          >
            <FieldMerchantLogo status={6}/>
          </Form.Item>
          <Form.Item
            label='店铺简介'
            name='description'
            rules={[
              {
                max: 200,
                message: '店铺简介最多200个字符',
              },
            ]}
          >
            <Input.TextArea
              placeholder='填写店铺简介，可让消费者更了解您的店铺'
              className='description'
              // onChange={handleChange}
              showCount
              maxLength={200}
              // resize="horizontal"
              rows={5}
              cols={40}
            />
          </Form.Item>

          <Form.Item
            label='第三方平台店铺链接'
            name='externalLink'
            rules={[
              {
              // required: true,
                max: 1000,
                message: '第三方平台链接最多1000个字符',
              },
            ]}
          >
            <Input className='extra-links' placeholder='填写真实的其他平台店铺链接' />
          </Form.Item>

          <Space style={{ marginLeft: 142 }}>
            <Button type='primary' htmlType='submit'>
            更新店铺基本信息
            </Button>
          </Space>
        </Form>
      </Card>

      <Card title="管理员信息" bodyStyle={{paddingTop: 20}}>
        <BaseAdmin />
      </Card>

      <Card title="联系方式" bodyStyle={{paddingTop: 20}}>
        <ShopContact />
      </Card>
    </div>
  );
}

export default BaseInfo;
