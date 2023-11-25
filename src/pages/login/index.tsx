/**
 * 用户登录页面
 *
 * sobird<i@sobird.me> at 2023/06/12 8:24:06 created.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {
  Button, Select, message, Form, Input,
} from 'antd';
import { MobileOutlined } from '@ant-design/icons';
import FormItemCaptcha from '@/components/form-item-captcha';
import Base from '@/layout/base';
import isMobilePhone from '@/utils/validator/isMobilePhone';
import AuthService from '@/services/auth';
import CommonService from '@/services/common';

import './index.scss';

const { Option } = Select;

interface LoginFormData {
  interCode: string;
  mobile: string;
  captcha: string;
  policy?: boolean;
}

function Login() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 提交注册
  const onFinish = async (values: LoginFormData) => {
    const { captcha, mobile, interCode } = values;
    const captchaCookie = Cookies.get('captcha');
    message.destroy();

    if (!isMobilePhone(mobile, interCode)) {
      const errorStr = '手机号格式不符合要求';
      message.error(errorStr);
      return;
    }

    if (captchaCookie !== captcha) {
      message.error('验证码错误');
      return;
    }

    setLoading(true);
    AuthService.login(values).then(() => {
      setLoading(false);
      navigate('/');
    });
  };

  const selectBefore = (
    <Form.Item noStyle name="interCode">
      <Select
        popupMatchSelectWidth={false}
        bordered={false}
        onClick={(event) => {
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
      <div className="base-login">
        <div className="base-title">登录</div>
        <Form
          form={form}
          name="base-form-login"
          initialValues={{ interCode: '86' }}
          onFinish={onFinish}
          colon={false}
          className="base-form"
          layout="horizontal"
        >
          <Form.Item name="mobile">
            <Input
              prefix={selectBefore}
              addonBefore={<MobileOutlined />}
              placeholder="请输入手机号"
              allowClear={false}
            />
          </Form.Item>
          <FormItemCaptcha
            phoneName="mobile"
            placeholder="请输入验证码"
            onCaptcha={async (mobile) => {
              const interCode = form.getFieldValue('interCode');

              if (!isMobilePhone(mobile, interCode)) {
                const errorStr = '手机号格式不符合要求';
                message.error(errorStr);
                throw new Error(errorStr);
              }

              await CommonService.captcha(mobile);
            }}
          />

          <Button
            style={{ marginTop: 20 }}
            loading={loading}
            type="primary"
            htmlType="submit"
            className="base-submit-btn"
            size="large"
          >
            登录
          </Button>
          <div className="signup-btn">
            <div>
              还没有账号？
              <a href="/#/register" target="_blank">
                免费注册
              </a>
            </div>
          </div>
        </Form>
      </div>
    </Base>
  );
}

export default Login;
