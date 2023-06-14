/**
 * 用户注册页面
 * 
 * sobird<i@sobird.me> at 2023/06/13 22:17:20 created.
 */

import { Button, Checkbox, Form, Input, Select } from 'antd';
import {RightOutlined} from '@ant-design/icons';
import Base from "@/components/layout/base";
import './index.scss';

const { Option } = Select;


const onFinish = (values: any) => {
  console.log('Success:', values);
};

const onFinishFailed = (errorInfo: any) => {
  console.log('Failed:', errorInfo);
};

const selectBefore = (
  <Select defaultValue="86" bordered={false} onClick={(event) => {event.stopPropagation()}}>
    <Option value="86">86(中国)</Option>
    <Option value="https://">https://</Option>
  </Select>
);

function Register() {
  return (
    <Base>
      <div className="base-register">
        <div className="base-title">注册</div>
        <Form
          name="base-form-register"
          // labelCol={{ span: 8 }}
          // wrapperCol={{ span: 16 }}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          colon={false}
          className='base-form-register'
        >
          <Form.Item
            label="手机号"
            name="mobile"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input prefix={selectBefore} placeholder='账号使用者手机' />
          </Form.Item>

          <Form.Item className='sms-code-item'>
            <Form.Item
              className='sms-code-item2'
              label="验证码"
              name="smsCode"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input placeholder='请输入验证码'/> 
            </Form.Item>
            
            <Button type="link" size='small' style={{padding: 0}}>
            获取验证码
            </Button>
          
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>我已阅读并同意 <a href="https://page.meituan.net/html/1615180237352_38ceb3/index.html" target="_blank" >《团好货商家版隐私政策》</a></Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className='base-submit-btn'>
              去注册
            </Button>
          </Form.Item>

          <Button type="link" style={{padding: 0}}>
          已有账号，去登录 <RightOutlined size={18} />
          </Button>
        </Form>
      </div>
    </Base>
  )
}

export default Register;
