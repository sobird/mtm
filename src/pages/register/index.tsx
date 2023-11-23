/**
 * 用户注册页面
 *
 * sobird<i@sobird.me> at 2023/06/13 22:17:20 created.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {
  Button, Select, message, Form, Input, Checkbox,
} from 'antd';
import { RightOutlined } from '@ant-design/icons';
import Base from '@/layout/base';
import FormItemCaptcha from '@/components/form-item-captcha';
import isMobilePhone from '@/utils/validator/isMobilePhone';
import isSmsCode from '@/utils/validator/isSmsCode';
import register from '@/services/register';

import './index.scss';

const { Option } = Select;

interface RegisterFormData {
  interCode: string;
  mobile: string;
  captcha: string;
  policy?: boolean;
}

function Register() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 提交注册
  const onFinish = async (values: RegisterFormData) => {
    const { policy, captcha, ...formData } = values;
    const captchaCookie = Cookies.get('captcha');
    message.destroy();
    if (!policy) {
      message.error('请勾选隐私协议');
      return;
    }

    if (captchaCookie !== captcha) {
      message.error('验证码错误');
      return;
    }

    setLoading(true);
    register(formData).then(() => {
      setLoading(false);
      navigate('/register/success');
    });
  };

  const selectBefore = (
    <Form.Item noStyle name="interCode">
      <Select
        popupMatchSelectWidth={false}
        bordered={false}
        onClick={event => {
          event.stopPropagation();
        }}
        optionLabelProp="label"
        onSelect={() => {
          form.validateFields(['mobile']);
        }}
      >
        <Option value="86" label="+86">
          +86(中国)
        </Option>
        <Option value="65" label="+65">
          +65(新加坡)
        </Option>
        <Option value="852" label="+852">
          +852(中国香港)
        </Option>
        <Option value="853" label="+853">
          +853(中国澳门)
        </Option>
      </Select>
    </Form.Item>
  );

  return (
    <Base>
      <div className="base-register">
        <div className="base-title">注册</div>
        <Form
          form={form}
          name="base-form-register"
          initialValues={{ interCode: '86' }}
          onFinish={onFinish}
          colon={false}
          className="base-form"
          layout="horizontal"
        >
          <Form.Item
            label="手机号"
            name="mobile"
            rules={[
              {
                validator: (_rule, value) => {
                  const interCode = form.getFieldValue('interCode');
                  if (!value) {
                    return Promise.reject(new Error('手机号不能为空'));
                  } if (isMobilePhone(value, interCode)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('手机号格式不符合要求'));
                },
              },
            ]}
          >
            <Input prefix={selectBefore} allowClear={false} placeholder="账号使用者手机" />
          </Form.Item>
          <FormItemCaptcha
            label="验证码"
            name="captcha"
            phoneName="mobile"
            placeholder="请输入验证码"
            rules={[
              {
                validator: (_rule, value) => {
                  if (!value) {
                    return Promise.reject(new Error('验证码不能为空'));
                  } if (isSmsCode(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('验证码格式不正确'));
                },
              },
            ]}
          />

          <Form.Item name="policy" valuePropName="checked">
            <Checkbox className="policy">
              我已阅读并同意
              {' '}
              <a href="https://page.meituan.net/html/1615180237352_38ceb3/index.html" target="_blank" rel="noreferrer">
                《团好货商家版隐私政策》
              </a>
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button loading={loading} type="primary" htmlType="submit" className="base-submit-btn">
              注册
            </Button>
          </Form.Item>
          <Button
            type="link"
            onClick={() => {
              navigate('/login');
            }}
            style={{ padding: 0, fontSize: 15, color: '#333' }}
          >
            已有账号，去登录
            {' '}
            <RightOutlined size={18} />
          </Button>
        </Form>
      </div>
    </Base>
  );
}

export default Register;
