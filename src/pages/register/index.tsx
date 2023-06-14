/**
 * 用户注册页面
 * 
 * sobird<i@sobird.me> at 2023/06/13 22:17:20 created.
 */

import { Button, Checkbox, Select, Form } from 'antd';
import {RightOutlined} from '@ant-design/icons';
import Base from "@/components/layout/base";
import isMobilePhone from '@/utils/validator/isMobilePhone';
import isSmsCode from '@/utils/validator/isSmsCode';
import './index.scss';

import { ProForm, ProFormText, ProFormCaptcha, ProFormCheckbox } from '@ant-design/pro-components';


console.log('ProFormText', ProFormText)

const { Option } = Select;

interface RegisterFormData {
  interCode: string,
  mobile: string,
  smsCode: string,
  policy?: boolean
}

const onFinish = (values: RegisterFormData) => {
  const {policy, ...formData} = values;
  console.log('Success:', policy, formData);
};

const selectBefore = (
  <ProForm.Item 
    noStyle
    name="interCode">
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
  </ProForm.Item>
);

function Register() {
  const [ form ] = ProForm.useForm();

  return (
    <Base>
      <div className="base-register">
        <div className="base-title">注册</div>
        <ProForm
          form={form}
          name="base-form-register"
          initialValues={{ interCode: 86 }}
          onFinish={onFinish}
          colon={false}
          className='base-form'
          layout="horizontal"
          submitter={{
            // 配置按钮文本
            searchConfig: {
              resetText: '重置',
              submitText: '提交',
            },
            // 配置按钮的属性
            resetButtonProps: {
              style: {
                // 隐藏重置按钮
                display: 'none',
              },
            },
            submitButtonProps: {},
        
            // 完全自定义整个区域
            render: (props, doms) => {
              console.log(props);
              return (
                <>
                  <ProForm.Item>
                    <Button type="primary" htmlType="submit" className='base-submit-btn'>注册
                    </Button>
                  </ProForm.Item>
                  <Button type="link" style={{padding: 0, fontSize: 15, color: '#333'}}>已有账号，去登录 <RightOutlined size={18} /></Button>
                </>
              );
            },
          }}
        >
          <ProFormText
            label="手机号"
            name="mobile"
            fieldProps={{
              prefix: selectBefore,
            }}
            allowClear={false}
            placeholder="账号使用者手机"
            rules={[
              { validator: (_rule, value) => {
                const interCode = form.getFieldValue('interCode');
                if(!value) {
                  return Promise.reject(new Error('手机号不能为空'));
                } else if(isMobilePhone(value, interCode)) {
                  return Promise.resolve();
                } else {
                  return Promise.reject(new Error('手机号格式不符合要求'));
                }
              }}
            ]}
          />
          <ProFormCaptcha
            label="验证码"
            name="captcha"
            // 手机号的 name，onGetCaptcha 会注入这个值
            phoneName="mobile"
            fieldProps={{
              //
            }}
            captchaProps={{
              value: 'ddd',
              defaultValue: 'ddd',
              size: 'small',
              type: 'link',
              style: { padding: 0 }
            }}
            rules={[
              { validator: (_rule, value) => {
                if(!value) {
                  return Promise.reject(new Error('验证码不能为空'));
                }else if(isSmsCode(value)) {
                  return Promise.resolve();
                } else {
                  return Promise.reject(new Error('验证码格式不正确'));
                }
              }}
            ]} 
            placeholder="请输入验证码"
            // captchaTextRender={
            //   (paramsTiming, paramsCount) => {
            //     return paramsTiming ? `${paramsCount} 秒后重新获取` : '获取验证码';
            //   }
            // }

            // 如果需要失败可以 throw 一个错误出来，onGetCaptcha 会自动停止
            // throw new Error("获取验证码错误")
            onGetCaptcha={async (mobile) => {
              // await waitTime(1000);
              console.log(`手机号 ${mobile} 验证码发送成功!`);
            }}
          />

          <ProFormCheckbox
            fieldProps={{
              className:'policy'
            }}
            name="policy">
              我已阅读并同意 <a href="https://page.meituan.net/html/1615180237352_38ceb3/index.html" target="_blank" >《团好货商家版隐私政策》</a>
          </ProFormCheckbox>
        </ProForm>
      </div>
    </Base>
  )
}

export default Register;
