/**
 * 用户注册页面
 * 
 * sobird<i@sobird.me> at 2023/06/13 22:17:20 created.
 */

import { Button, Checkbox, Form, Input, Select } from 'antd';
import {RightOutlined} from '@ant-design/icons';
import Base from "@/components/layout/base";
import isMobilePhone from '@/utils/validator/isMobilePhone';

import './index.scss';

const { Option } = Select;


const onFinish = (values: any) => {
  console.log('Success:', values);
};

const onFinishFailed = (errorInfo: any) => {
  console.log('Failed:', errorInfo);
};

const selectBefore = (
  <Form.Item name="interCode" noStyle rules={[{ required: true, message: '验证码不能为空' }]}>
    <Select 
      popupMatchSelectWidth={false} 
      bordered={false} 
      onClick={(event) => {event.stopPropagation()}} 
      optionLabelProp="label"
    >
      <Option value="86" label="+86">+86(中国)</Option>
      <Option value="65" label="+65">+65(新加坡)</Option>
      <Option value="852" label="+852">+852(中国香港)</Option>
      <Option value="853" label="+853">+853(中国澳门)</Option>
    </Select>
  </Form.Item>
);

function Register() {
  const [ form ] = Form.useForm();



  return (
    <Base>
      <div className="base-register">
        <div className="base-title">注册</div>
        <Form
          form={form}
          name="base-form-register"
          initialValues={{ interCode: 86 }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          colon={false}
          className='base-form'
        >
          <Form.Item
            label="手机号"
            name="mobile"
            rules={[
              { required: true, message: '手机号不能为空' },
              { validator: (_rule, value) => {
                const interCode = form.getFieldValue('interCode');
                if(isMobilePhone(value, interCode) || value === '') {
                  return Promise.resolve();
                } else {
                  return Promise.reject(new Error('手机号格式不符合要求'));
                }
              }}
            ]}
          >
            <Input prefix={selectBefore} placeholder='账号使用者手机' />
          </Form.Item>

          <Form.Item 
            className='sms-code-item'
            label="验证码">
            <Form.Item name="smsCode" noStyle rules={[{ required: true, message: '验证码不能为空' }]} className='sms-code-item2'>
              <Input placeholder='请输入验证码'/> 
            </Form.Item>
            
            <Button className='sms-code-btn' type="link" size='small' style={{padding: 0}}>
            获取验证码
            </Button>
          
          </Form.Item>

          <Form.Item name="policy" valuePropName="checked">
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
