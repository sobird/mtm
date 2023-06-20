/**
 * 用户登录页面
 *
 * sobird<i@sobird.me> at 2023/06/12 8:24:06 created.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Button, Select, message } from 'antd';
import { MobileOutlined }  from '@ant-design/icons';
import Base from "@/components/layout/base";
import isMobilePhone from '@/utils/validator/isMobilePhone';
import captcha from '@/services/common/captcha';
import { register } from '@/services/user';

import './index.scss';

import { ProForm, ProFormText, ProFormCaptcha } from '@ant-design/pro-components';

const { Option } = Select;

interface LoginFormData {
  interCode: string,
  mobile: string,
  captcha: string,
  policy?: boolean
}

function Login() {
  const navigate = useNavigate();
  const [ form ] = ProForm.useForm();
  const [loading, setLoading] = useState(false);

  // 提交注册
  const onFinish = async (values: LoginFormData)=> {
    const { captcha, mobile, interCode } = values;
    const captcha_cookie = Cookies.get('captcha');
    message.destroy();

    if(!isMobilePhone(mobile, interCode)) {
      const error_str = "手机号格式不符合要求";
      message.error(error_str);
      return;
    }

    if(captcha_cookie != captcha) {
      message.error('验证码错误');
      return;
    }

    setLoading(true);
    register(values).then(() => {
      setLoading(false);
      navigate('/');
    })
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
        onSelect={() => {
          form.validateFields(['mobile']);
        }}
      >
        <Option value="86" label="+86">+86(中国)</Option>
        <Option value="65" label="+65">+65(新加坡)</Option>
        <Option value="852" label="+852">+852(中国香港)</Option>
        <Option value="853" label="+853">+853(中国澳门)</Option>
      </Select>
    </ProForm.Item>
  );

  return (
    <Base>
      <div className="base-login">
        <div className="base-title">登录</div>
        <ProForm
          form={form}
          name="base-form-login"
          initialValues={{ interCode: "86" }}
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
              return (
                <>
                  <Button style={{marginTop: 20}} loading={loading} type="primary" htmlType="submit" className='base-submit-btn'>登录</Button>
                  <div className="signup-btn"><div>还没有账号？<a href="/#/register" target="_blank">免费注册</a></div></div>
                </>
              );
            },
          }}
        >
          <ProFormText
            name="mobile"
            fieldProps={{
              prefix: selectBefore,
              addonBefore: <MobileOutlined />,
            }}
            allowClear={false}
            placeholder="请输入手机号"
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
              size: 'small',
              type: 'link',
              style: { padding: 0 }
            }}
            placeholder="请输入验证码"
            // captchaTextRender={
            //   (paramsTiming, paramsCount) => {
            //     return paramsTiming ? `${paramsCount} 秒后重新获取` : '获取验证码';
            //   }
            // }

            // 如果需要失败可以 throw 一个错误出来，onGetCaptcha 会自动停止
            // throw new Error("获取验证码错误")
            onGetCaptcha={async (mobile) => {
              const interCode = form.getFieldValue('interCode');

              if(!isMobilePhone(mobile, interCode)) {
                const error_str = "手机号格式不符合要求";
                message.error(error_str);
                throw new Error(error_str);
              }
              
              const res = await captcha(mobile);
              message.success(`【美团】${res.captcha}（商户注册验证码）。工作人员不会向您索要，请勿向任何人泄露，以免造成账户或资金损失。`, 5);
            }}
          />
        </ProForm>
      </div>
    </Base>
  )
}

export default Login;
