/**
 * 管理员
 *
 * sobird<i@sobird.me> at 2023/10/26 15:17:34 created.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Form, Input, Space } from 'antd';
import FieldIdCard from '@/components/field-id-card';
import FieldTermPick from '@/components/field-term-picker';

import './index.scss';

const formItemLayout = {
  labelCol: {
    flex: '0 0 142px',
  },
};

function BaseAdmin() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  return (
    <div className='shop-base-admin'>
      <Alert
        message={
          <div className='admin-alert'>
            您已申请修改管理员信息，当前处于审核中，审核期间不可以再次修改信息，感谢您的耐心等待。
            <Button
              type='link'
              onClick={() => {
                navigate('/shop/profile/admin');
              }}
            >
              查看申请信息
            </Button>
          </div>
        }
        type='warning'
        showIcon
        icon='roo-icon-info-circle'
      />

      {/* 删除驳回申请 */}
      <Alert
        message={
          <div className='admin-alert'>
            <span>审核驳回。您申请修改的管理员信息审核不通过，请针对驳回原因进行修改后再次提交</span>
            <Button
              type='link'
              onClick={() => {
                navigate('/shop/profile/admin?mode=edit');
              }}
            >
              去修改
            </Button>
          </div>
        }
        type='error'
        closable
        showIcon
        onClose={() => false}
        // extra={(
        //   <Button
        //     icon="close" type="text" status="normal"
        //     onClick={() => {
        //       setAlertCloseVisible(true);
        //       Modal.confirm({
        //         title: '确定删除被驳回的管理员变更申请吗？',
        //         style: { width: 400, height: 200, overflow: 'hidden' },
        //         confirmText: '删除',
        //         onConfirm: async () => {
        //           mc('b_group_mall_b_hbkebu72_mc');
        //           try {
        //             await merchantApi.deleteAuditManagerInfo(null, false);
        //             isBaseTab ? queryManagerInfo() : auditManagerInfo();
        //             setAlertCloseVisible(false);
        //           } catch (e) {
        //             Message.error(e.msg || e.message || '删除被驳回的管理员信息异常');
        //           }
        //         },
        //         onCancel: () => { },
        //       });
        //     }}
        //   />
        // )}
        icon='roo-icon-times-circle'
      />

      <Form
        {...formItemLayout}
        // initialValues={initialValues}
        form={form}
        onFinish={values => {
          console.log('values', values);
          // todo 
        }}
      >
        <Form.Item required label='证件类型' name="idCardType">
          <div className="id-type-text">
            中国大陆居民身份证 <span>(店铺管理员仅支持大陆居民身份证申请)</span>
          </div>
        </Form.Item>

        <Form.Item label='电子证件照' name="idCardPhotos">
          <FieldIdCard />
        </Form.Item>

        <Form.Item label='管理员姓名' name="name">
          <Input
            placeholder="请保持与身份证件上的姓名一致"
          />
        </Form.Item>

        <Form.Item label='身份证件号' name="cardNum">
          <Input
            placeholder="请保持与身份证件上的证件号一致"
          />
        </Form.Item>

        <Form.Item
          label='有效截止日'
          name='description'
        >
          <FieldTermPick />
        </Form.Item>

        <Form.Item label='管理员手机号' name="phone">
          <Input
            placeholder="请填写管理员手机号"
          />
        </Form.Item>

        <Form.Item label='手机验证码' name="phoneCode">
          <Input
            placeholder="请查看手机短信，输入验证码"
          />
        </Form.Item>

        <Space style={{ marginLeft: 142 }}>
          <Button type='primary' htmlType='submit'>
            更新店铺基本信息
          </Button>
        </Space>
      </Form>
    </div>
  );
}

export default BaseAdmin;
