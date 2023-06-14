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
  <Select defaultValue="86" popupMatchSelectWidth={false} bordered={false} onClick={(event) => {event.stopPropagation()}} optionLabelProp="label">
    <Option value="86" label="+86">+86(中国)</Option>
    <Option value="65" label="+65">+65(新加坡)</Option>
    <Option value="852" label="+852">+852(中国香港)</Option>
    <Option value="853" label="+853">+853(中国澳门)</Option>
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
          className='base-form'
        >
          <Form.Item
            label="手机号"
            name="mobile"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input prefix={selectBefore} placeholder='账号使用者手机' />
          </Form.Item>

          <Form.Item 
            className='sms-code-item'
            label="验证码"
            name="smsCode"
            rules={[{ required: true, message: 'Please input your password!' }]}>
            <Form.Item
              className='sms-code-item2'
              hasFeedback={false}
            >
              <Input placeholder='请输入验证码'/> 
            </Form.Item>
            
            <Button className='sms-code-btn' type="link" size='small' style={{padding: 0}}>
            获取验证码
            </Button>
          
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked">
            <Checkbox className='policy'>我已阅读并同意 <a href="https://page.meituan.net/html/1615180237352_38ceb3/index.html" target="_blank" >《团好货商家版隐私政策》</a></Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className='base-submit-btn'>
              注册
            </Button>
          </Form.Item>

          <Button type="link" style={{padding: 0, fontSize: 15}}>
          已有账号，去登录 <RightOutlined size={18} />
          </Button>
        </Form>
      </div>
    </Base>
  )
}

export default Register;
