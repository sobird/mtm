/*
 * index.tsx
 * 
 * sobird<i@sobird.me> at 2023/06/30 20:42:08 created.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Steps, theme, Button, message, Card, Upload, Checkbox, Radio, Space, Input, DatePicker } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Entry from "@/components/layout/entry";
import Invitation, { IInvitationRequestData } from '@/services/common/invitation';
import EntryEnumService, { IEntryEnum } from '@/services/merchant/entry/enum';

const { RangePicker } = DatePicker;

import './index.scss';

const steps = [
  {
    title: '填写主体信息',
    content: 'First-content',
  },
  {
    title: '填写公司概况',
    content: 'Second-content',
  },
  {
    title: '填写资质信息',
    content: 'Last-content',
  },
  {
    title: '填写店铺信息',
    content: 'Last-content',
  },
];

function EntryCompany() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [option, setOption] = useState<IEntryEnum>();

  useEffect(() => {
    EntryEnumService.get().then(res => {
      console.log('res', res)

      setOption(res);
    })
  }, []);

  const onFinish = (values: IInvitationRequestData) => {
    Invitation.post(values).then(() => {
      navigate('/settleinjx/shop');
    });
  };

  const { token } = theme.useToken();
  

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    if(current === 0) {
      navigate('/settleinjx/shop');
      return;
    }
    console.log('current', current)
    setCurrent(current - 1);
  };

  const items = steps.map((item) => ({ key: item.title, title: item.title }));

  const contentStyle: React.CSSProperties = {
    lineHeight: '260px',
    color: token.colorTextTertiary,
    borderRadius: token.borderRadiusLG,
    borderTop: `1px dashed ${token.colorBorder}`,
    marginTop: 16,
    padding: `10px 20px`,
  };

  return (
    <Entry>
      <div className="entry-company">
        <Steps size="small" className='company-steps' current={current} items={items} />
        <div style={contentStyle}>
          <Card title="企业主体信息" bordered={false}>
            <Form
              name="basic"
              onFinish={onFinish}
              labelCol= {{ span: 4 }}
              wrapperCol= {{ span: 20 }}
            >
              <Form.Item
                label="公司类型"
                name="companyType"
                rules={[{ required: true, message: '公司类型不能为空' }]}
              >
                <Radio.Group options={option?.companyTypeList.map(item => ({value: item.type, label: item.name}))} />
              </Form.Item>

              <Form.Item
                label="销售渠道"
                name="sellChanne"
              >
                <Checkbox.Group options={option?.sellChannelList.map(item => ({value: item.type, label: item.name}))} />
              </Form.Item>

              <Form.Item 
                label="营业执照"
                name="businessLicense"
                rules={[{ required: true, message: '营业执照不能为空' }]}>
                <Space>
                  <Upload action="/upload.do" listType="picture-card">
                    <div>
                      <PlusOutlined style={{fontSize: '30px'}} />
                      <div>点击上传</div>
                    </div>
                  </Upload>
                  <div className="form-prompt"><p>1.请上传清晰的多证合一营业执照（统一社会信用代码）</p><p>2.文件最多上传1张，大小不得超过20MB</p><p>3.文件格式支持：JPG/JPEG/PNG/GIF/BPM</p><p>4.企业主体需满足&nbsp;<a class="name-link" target="_blank" href="https://rules-center.meituan.com/rules-detail/602?commonType=2">美团电商平台入驻标准</a>&nbsp;要求</p></div>
                </Space>

                <Card title="请核对营业执照信息，若信息不符，请手动修改" className='license-info'>
                  <Form.Item
                    label="统一社会信用代码"
                    name="socialCreditCode"
                    labelCol= {{ span: 5 }}
                    wrapperCol= {{ span: 10 }}
                    rules={[{ required: true, message: '统一社会信用代码不能为空' }]}>
                    <Input placeholder="请填写营业执照上的注册号" />
                  </Form.Item>
                  <Form.Item
                    label="公司名称"
                    name="name"
                    labelCol= {{ span: 5 }}
                    wrapperCol= {{ span: 10 }}
                    rules={[{ required: true, message: '公司名称不能为空' }]}>
                    <Input placeholder="请按照营业执照，填写公司名称" />
                  </Form.Item>

                  <Form.Item
                    label="经营地址"
                    name="address"
                    labelCol= {{ span: 5 }}
                    wrapperCol= {{ span: 10 }}
                    rules={[{ required: true, message: '经营地址不能为空' }]}>
                    <Input placeholder="请按照营业执照，填写公司地址" />
                  </Form.Item>

                  <Form.Item
                    label="营业期限"
                    name="operatingTimeType"
                    labelCol= {{ span: 5 }}
                    wrapperCol= {{ span: 10 }}
                    rules={[{ required: true, message: '经营地址不能为空' }]}>
                    <RangePicker />
                  </Form.Item>

                  <Form.Item
                    label="注册资金"
                    name="registeredCapital"
                    labelCol= {{ span: 5 }}
                    wrapperCol= {{ span: 10 }}
                    rules={[{ required: true, message: '注册资金不能为空' }]}>
                    <Input placeholder="请输入" suffix="万元" />
                    <span className='input-help'>若注册资金币种不是人民币，可按照当前汇率换算成人民币后进行填写</span>
                  </Form.Item>
                </Card>
              </Form.Item>

              <Form.Item name="remember" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>

              <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                <Button type="primary" htmlType="submit">
        Submit
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>

        <div className='entry-footer'>
          <Button style={{ margin: '0 20px' }} onClick={() => prev()}>
            上一步
          </Button>
          {current < steps.length - 1 && (
            <Button type="primary" onClick={() => next()}>
            下一步
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button type="primary" onClick={() => message.success('Processing complete!')}>
            完成
            </Button>
          )}
        </div>
      </div>
    </Entry>
  )
}

export default EntryCompany;
