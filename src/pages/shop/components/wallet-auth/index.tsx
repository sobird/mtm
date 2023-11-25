/**
 * 更改钱包前置校验
 *
 * @todo
 * 验证码组件
 *
 * sobird<i@sobird.me> at 2023/10/29 11:04:20 created.
 */

import { useState } from 'react';
import classNames from 'classnames';
import {
  Modal, Alert, Steps, Form, Input,
} from 'antd';
import type {} from 'antd/es/modal';
import { isMobilePhone, isChineseName } from '@/utils/validator';
import FormItemCaptcha from '@/components/form-item-captcha';

const formItemLayout = {
  labelCol: {
    flex: '0 0 142px',
  },
  wrapperCol: {
    span: 12,
  },
};

const WalletAuth = () => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(true);
  const [current, setCurrent] = useState(0);

  const onOk = () => {
    if (current !== 1) {
      setCurrent((prevState) => { return prevState + 1; });
      console.log(current);
    }
  };

  const onCancel = () => {
    if (current !== 0) {
      setCurrent((prevState) => { return prevState - 1; });
      return;
    }
    setOpen(false);
  };

  return (
    <Modal
      title="变更为个人钱包"
      open={open}
      cancelText={current === 0 ? '取消' : '上一步'}
      okText={current === 1 ? '确认' : '下一步'}
      onCancel={onCancel}
      onOk={onOk}
    >
      <Alert message="更换钱包，原钱包余额不会自动转入新钱包，建议先提现再更换" type="warning" showIcon style={{ marginBottom: 24 }} />

      <Steps items={[{ title: '管理员认证' }, { title: '确认钱包信息' }]} current={current} style={{ marginBottom: 24 }} />

      <div className="change-wallet-content">
        <div className="sms-code-box">
          {

          }
        </div>
      </div>

      <Form form={form} className={classNames('admin-form')} {...formItemLayout}>
        <Form.Item label="企业名称" name="servicePhoneNum">
          <Input placeholder="请您及时填写客服电话" />
        </Form.Item>

        <Form.Item
          label="企业证件号"
          name="emergencyContact"
          required
          rules={[
            {
              async validator(rule, value) {
                if (!isChineseName(value)) {
                  throw new Error('请输入正确的中国人名');
                }
              },
            },
          ]}
        >
          <Input placeholder="请输入紧急联系人姓名" />
        </Form.Item>

        <Form.Item
          label="钱包绑定手机"
          name="emergencyContactPhone"
          required
          rules={[
            {
              async validator(rule, value) {
                if (!isMobilePhone(value)) {
                  throw new Error('请输入正确的中国大陆11位手机号码');
                }
              },
            },
          ]}
        >
          <Input placeholder="请输入手机号" />
        </Form.Item>
        <FormItemCaptcha placeholder="请输入验证码" phoneName="emergencyContactPhone" />
      </Form>
    </Modal>
  );
};

export default WalletAuth;
