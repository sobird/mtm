/**
 * 签署合作协议弹层组件
 * 
 * sobird<i@sobird.me> at 2022/03/16 17:53:02 created.
 */

import { useState } from 'react';
import Cookies from 'js-cookie';
import { Alert, Button, message, Form, Tooltip, Modal } from 'antd';
import { ProFormCaptcha, ProFormCheckbox } from '@ant-design/pro-components';
import { InfoCircleOutlined } from '@ant-design/icons';

import CaptchaService from '@/services/common/captcha';
import MerchantService from '@/services/merchant';

import './index.scss';

interface ContractSignProps {
  config: {
    bizType: number;
    mobile: number;
    state: number;
  }
}

export default function ContractSign({ config } : ContractSignProps) {
  const [ form ] = Form.useForm();
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  const { mobile = '', bizType, state } = config || {};

  const onFinish = async (values)=> {
    console.log('values', values)
    const { captcha, policy } = values;
    const captcha_cookie = Cookies.get('captcha');
    message.destroy();

    if(captcha_cookie != captcha) {
      message.error('验证码错误');
      return;
    }

    if(!policy) {
      message.error('请勾选合作协议');
      return;
    }

    setLoading(true);
    MerchantService.signContract(values).then(() => {
      message.success({
        content: '恭喜您与平台达成合作',
        duration: 1,
        onClose: () => {
          setVisible(false);
        },
      });
    }).catch (e => {
      message.error({
        content: e.msg || e.message || '签署合约异常',
      });
    }).finally(() => {
      setLoading(false);
    })
  };

  return (
    <Modal
      title="签约合作协议"
      closeIcon={false}
      style={{
        width: '500px',
      }}
      open={visible}
      footer={null}
    >
      <div className="sign-constract-box">
        <div className="alert-box">
          {/* 100代表pop商家 30代表合同过期 */}
          {bizType === 100 && state === 30 ? (
            <Alert
              className="contract-dated"
              message="您的协议已到期，我们将通过短信验证来确认您与平台继续达成合作"
              icon={<InfoCircleOutlined />}
              showIcon={true}
            />
          ) : (
            <Alert message="我们将通过短信验证来确认您与平台正式达成合作" icon={<InfoCircleOutlined />} />
          )}
        </div>
        <div className="tip-box">
          <span>验证码将发送到 </span>
          <span>{mobile}</span>
          <span>，如需更换手机号请联系招商经理</span>
        </div>
        <Form
          form={form}
          // value={formValue}
          // rules={rules}
          layout="horizontal"
          onFinish={onFinish}
        >
          <ProFormCaptcha
            name="captcha"
            // 手机号的 name，onGetCaptcha 会注入这个值
            phoneName="mobile"
            fieldProps={{
            //
              width: '200px'
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
              const res = await CaptchaService.get(mobile);
            }}
          />

          <ProFormCheckbox
            fieldProps={{
              className:'policy',
            }}
            
            name="policy">
            我已阅读并同意 <a href="https://page.meituan.net/html/1615180237352_38ceb3/index.html" target="_blank" >《美团电商合作协议》</a>
            <Tooltip color="#fff" title="以下协议与纸质协议拥有同等效力，点击“确认合作”视为您同意并接受合作协议条款。如对合作条款有异议，可联系业务经理。">
              <InfoCircleOutlined color="#ccc" />
            </Tooltip>
          </ProFormCheckbox>

          <Button type="primary" loading={loading} style={{width: "100%"}} htmlType="submit">确认合作</Button>
        </Form>
      </div>
    </Modal>
  );
}
