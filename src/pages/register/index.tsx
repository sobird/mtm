/**
 * 用户注册页面
 * 
 * sobird<i@sobird.me> at 2023/06/13 22:17:20 created.
 */

import { Button, Checkbox, Form, Input } from 'antd';
import Base from "@/components/layout/base";
import './index.scss';

const onFinish = (values: any) => {
  console.log('Success:', values);
};

const onFinishFailed = (errorInfo: any) => {
  console.log('Failed:', errorInfo);
};

function Register() {
  return (
    <Base>
      <div className="base-register">
        <div className="base-title">注册</div>
        <Form
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            label="手机号"
            name="mobile"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="验证码"
            name="smsCode"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
            <Checkbox>我已阅读并同意 <a href="https://page.meituan.net/html/1615180237352_38ceb3/index.html" target="_blank" >《团好货商家版隐私政策》</a></Checkbox>
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" htmlType="submit">
              去注册
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Base>
  )
}

export default Register;
