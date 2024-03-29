/*
 * step1
 *
 * sobird<i@sobird.me> at 2023/07/20 12:23:22 created.
 */

import React, { PropsWithChildren, useState } from 'react';
import {
  Card,
  Checkbox,
  Form,
  Input,
  Radio,
  Space,
  Upload,
  DatePicker,
  Button,
  Select,
  Image,
  FormInstance,
} from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import TermPick from '@/components/field-term-picker';
import { IMerchantOptions } from '@/services/merchant';

import OcrUpload from '@/components/ocr-upload';

import IdCardPreview1 from '@/assets/idcard_preview_1.png';
import IdCardPreview2 from '@/assets/idcard_preview_2.png';
import IdUploadDemo from '../id-upload-demo';

const { RangePicker } = DatePicker;

interface Step1Props {
  option: IMerchantOptions;
  form: FormInstance;
}

const formItemLayout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 12 },
};

const Step1: React.FC<PropsWithChildren<Step1Props>> = ({ option, form }) => {
  const [license, setLicense] = useState(false);

  const onFinish = (values) => {
    console.log('values', values);
  };

  const socialCreditCode = form.getFieldValue(['company', 'businessLicense', 'socialCreditCode']);

  return (
    <Form name="basic" onFinish={onFinish} labelCol={{ span: 4 }} wrapperCol={{ span: 20 }} size="middle" form={form}>
      <Card title="企业主体信息" bordered={false}>
        <Form.Item label="测试组件" name="testName">
          <TermPick value={[true, '2023-01-10', '2023-01-11']} rangePicker />
        </Form.Item>

        <Form.Item
          label="公司类型"
          name={['company', 'companyType']}
          rules={[{ required: true, message: '公司类型不能为空' }]}
        >
          <Radio.Group
            options={option?.companyTypeList.map((item) => {
              return { value: item.type, label: item.name };
            })}
          />
        </Form.Item>

        <Form.Item label="销售渠道" name={['company', 'distChannel']}>
          <Checkbox.Group
            options={option?.distChannelList.map((item) => {
              return { value: item.type, label: item.name };
            })}
          />
        </Form.Item>

        <Form.Item label="营业执照" name="businessLicense">
          <Space>
            <Form.Item
              name={['company', 'businessLicense', 'url']}
              rules={[{ required: true, message: '营业执照不能为空' }]}
              noStyle
            >
              <OcrUpload
                type={1}
                onUploadSuccess={(res) => {
                  form.setFieldValue(['company', 'businessLicense', 'socialCreditCode'], res.number);
                  form.setFieldValue(['company', 'businessLicense', 'name'], res.name);
                  form.setFieldValue(['company', 'businessLicense', 'address'], res.address);
                  form.setFieldValue(['company', 'businessLicense', 'term'], res.term);
                  form.setFieldValue(['company', 'businessLicense', 'capital'], res.capital);

                  if (res.number) {
                    setLicense(true);
                  }
                }}
              />
            </Form.Item>
            <div className="form-prompt">
              <p>1.请上传清晰的多证合一营业执照（统一社会信用代码）</p>
              <p>2.文件最多上传1张，大小不得超过20MB</p>
              <p>3.文件格式支持：JPG/JPEG/PNG/GIF/BPM</p>
              <p>
                4.企业主体需满足&nbsp;
                <a
                  className="name-link"
                  target="_blank"
                  href="https://rules-center.meituan.com/rules-detail/602?commonType=2"
                  rel="noreferrer"
                >
                  美团电商平台入驻标准
                </a>
                &nbsp;要求
              </p>
            </div>
          </Space>

          {(socialCreditCode || license) && (
            <Card title="请核对营业执照信息，若信息不符，请手动修改" className="item-card">
              <Form.Item
                {...formItemLayout}
                label="统一社会信用代码"
                name={['company', 'businessLicense', 'socialCreditCode']}
                rules={[{ required: true, message: '统一社会信用代码不能为空' }]}
              >
                <Input placeholder="请填写营业执照上的注册号" />
              </Form.Item>
              <Form.Item
                {...formItemLayout}
                label="公司名称"
                name={['company', 'businessLicense', 'name']}
                rules={[{ required: true, message: '公司名称不能为空' }]}
              >
                <Input placeholder="请按照营业执照，填写公司名称" />
              </Form.Item>

              <Form.Item
                {...formItemLayout}
                label="经营地址"
                name={['company', 'businessLicense', 'address']}
                rules={[{ required: true, message: '经营地址不能为空' }]}
              >
                <Input placeholder="请按照营业执照，填写公司地址" />
              </Form.Item>

              <Form.Item
                {...formItemLayout}
                name={['company', 'businessLicense', 'term']}
                label="营业期限"
                wrapperCol={{ span: 16 }}
                rules={[{ required: true, message: '营业期限不能为空' }]}
              >
                <TermPick rangePicker />
              </Form.Item>

              <Form.Item {...formItemLayout} label="注册资金">
                <Form.Item
                  name={['company', 'businessLicense', 'capital']}
                  noStyle
                  rules={[{ required: true, message: '注册资金不能为空' }]}
                >
                  <Input placeholder="请输入" suffix="万元" />
                </Form.Item>
                <span className="input-help">若注册资金币种不是人民币，可按照当前汇率换算成人民币后进行填写</span>
              </Form.Item>
            </Card>
          )}
        </Form.Item>

        <Form.Item label="一般纳税人资格证电子版" name={['company', 'certificateTaxpayer']}>
          <Space>
            <Upload action="/upload.do" listType="picture-card">
              <div>
                <PlusOutlined style={{ fontSize: '30px' }} />
                <div>点击上传</div>
              </div>
            </Upload>
            <div className="form-prompt">
              <p>1.请上传清晰的一般纳税人资格证，复印件需加盖公司印章</p>
              <p>2.文件最多上传1张，大小不得超过20MB</p>
              <p>3.文件格式支持：JPG/JPEG/PNG/GIF/BPM</p>
            </div>
          </Space>
        </Form.Item>

        <Form.Item
          label="银行开户证明"
          name={['company', 'certificateBankOpen']}
          rules={[{ required: true, message: '银行开户证明不能为空' }]}
        >
          <Space>
            <Upload action="/upload.do" listType="picture-card">
              <div>
                <PlusOutlined style={{ fontSize: '30px' }} />
                <div>点击上传</div>
              </div>
            </Upload>
            <div className="form-prompt">
              <p>1.请上传清晰的证照，如果是复印件需加盖公司印章</p>
              <p>2.文件最多上传1张，大小不得超过20MB</p>
              <p>3.文件格式支持：JPG/JPEG/PNG/GIF/BPM</p>
              <p>4.上传银行开户许可证或基本存款账户信息扫描件</p>
            </div>
          </Space>
        </Form.Item>

        <Form.Item
          label="办公地址"
          name={['company', 'officeAddress']}
          wrapperCol={{ span: 12 }}
          rules={[{ required: true, message: '办公地址不能为空' }]}
        >
          <Input placeholder="请填写真实的办公地址" />
        </Form.Item>

        <Form.Item label="公司简介" wrapperCol={{ span: 12 }}>
          <Form.Item
            name={['company', 'companyDesc']}
            noStyle
            rules={[{ required: true, message: '公司简介不能为空' }]}
          >
            <Input.TextArea
              showCount
              maxLength={1000}
              autoSize={{ minRows: 5 }}
              placeholder="可以从品牌定位、品牌产品线、市场占有率或年销量、品牌当下布局、品牌未来规划等方面介绍，最多不得超过1000字"
            />
          </Form.Item>
          <Form.Item name={['company', 'companyFile']} noStyle>
            <Upload action="/upload.do">
              <Button type="dashed" style={{ marginTop: '20px', marginBottom: '10px' }} icon={<UploadOutlined />}>
                {' '}
                上传文件
              </Button>
            </Upload>
          </Form.Item>

          <div className="form-prompt">
            <p>1.支持上传相关公司介绍等相关资料附件</p>
            <p>2.文件最多上传10个，单个文件大小不得超过50MB</p>
            <p>3.文件格式支持：PDF/PPT/DOC/JPG/JPEG/PNG/GIF/BPM</p>
          </div>
        </Form.Item>
      </Card>

      <Card title="法人证件信息" bordered={false}>
        <Form.Item
          label="证件类型"
          name={['company', 'legalPerson', 'idType']}
          wrapperCol={{ span: 12 }}
          rules={[{ required: true, message: '法人手机号不能为空' }]}
        >
          <Select defaultValue={1001}>
            <Select.Option value={1001}>中国大陆居民身份证</Select.Option>
            <Select.Option value={1002}>海外护照</Select.Option>
            <Select.Option value={1003}>港澳居民往来内地通行证</Select.Option>
            <Select.Option value={1003}>台湾居民往来大陆通行证</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="电子证件照" name="businessLicense" rules={[{ required: true, message: '营业执照不能为空' }]}>
          <Space style={{ marginBottom: '10px' }}>
            <Upload action="/upload.do">
              <Image preview={false} src={IdCardPreview1} width={120} style={{ cursor: 'pointer' }} />
            </Upload>

            <Upload action="/upload.do">
              <Image preview={false} src={IdCardPreview2} width={120} style={{ cursor: 'pointer' }} />
            </Upload>
          </Space>

          <div className="input-help">
            请上传手持证件正反面照，或身份证件的正反面彩色扫描照片，或正反面复印件加盖入驻主体鲜章，
            <IdUploadDemo>查看示例</IdUploadDemo>
          </div>

          <Card title="请核对身份信息，若信息不符合，可手动修改" className="item-card">
            <Form.Item
              {...formItemLayout}
              label="姓名"
              name={['company', 'legalPerson', 'name']}
              rules={[{ required: true, message: '法人姓名不能为空' }]}
            >
              <Input placeholder="请保持与身份证件上的姓名一致" />
            </Form.Item>
            <Form.Item
              {...formItemLayout}
              label="证件号码"
              name={['company', 'legalPerson', 'idNum']}
              rules={[{ required: true, message: '证件号码不能为空' }]}
            >
              <Input placeholder="请保持与身份证件上的证件号一致" />
            </Form.Item>

            <Form.Item
              {...formItemLayout}
              label="有效截止日"
              name="cardValidateType"
              rules={[{ required: true, message: '经营地址不能为空' }]}
            >
              <RangePicker />
            </Form.Item>
          </Card>
        </Form.Item>

        <Form.Item
          label="法人手机号"
          name={['company', 'legalPerson', 'mobile']}
          wrapperCol={{ span: 12 }}
          rules={[{ required: true, message: '法人手机号不能为空' }]}
        >
          <Input placeholder="请填写真实的办公地址" showCount maxLength={11} />
        </Form.Item>
      </Card>
    </Form>
  );
};

export default Step1;
