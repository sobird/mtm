/**
 * 管理员表单组件
 *
 * @todo
 *
 * sobird<i@sobird.me> at 2023/10/26 15:17:34 created.
 */

import { FC, PropsWithChildren } from 'react';
import classNames from 'classnames';
import { Form, Input, Space } from 'antd';
import type { FormProps } from 'antd';
import { isIdentityCard, isMobilePhone } from '@/utils/validator';
import FieldIdCard from '@/components/field-id-card';
import FieldTermPick from '@/components/field-term-picker';
import FieldUploadFile from '@/components/field-upload-file';
import FormItemCaptcha from '@/components/form-item-captcha';
import VenusService from '@/services/common/venus';

import './index.scss';

const formItemLayout = {
  labelCol: {
    flex: '0 0 142px',
  },
  wrapperCol: {
    span: 12,
  },
};

interface CouponFormProps extends FormProps {
  mode?: 'create' | 'update' | 'detail';
}

const AdminForm: FC<PropsWithChildren<CouponFormProps>> = ({
  className, form, children, mode, ...props
}) => {
  const [_form] = Form.useForm();
  const formInstance = form || _form;

  return (
    <Form form={formInstance} className={classNames('admin-form', className)} {...formItemLayout} {...props}>
      <Form.Item required label="证件类型" name="idCardType">
        <div className="id-type-text">
          中国大陆居民身份证
          {' '}
          <span>(店铺管理员仅支持大陆居民身份证申请)</span>
        </div>
      </Form.Item>

      <Form.Item
        label="电子证件照"
        name="idCardPhotos"
        required
        rules={[
          {
            async validator(rule, value: [string, string]) {
              if (!value?.[0] && !value?.[1]) {
                throw new Error('电子证件照不能为空');
              }
              if (!value?.[0]) {
                throw new Error('请上传身份证人像面');
              }
              if (!value?.[1]) {
                throw new Error('请上传身份证国徽面');
              }
            },
          },
        ]}
      >
        <FieldIdCard onUploadSuccess={(res, index) => {
          console.log('res', res, index);

          if (index === 0) {
            // 身份证正面才识别
            VenusService.ocr({
              type: 0,
              url: res.url,
            }).then(idInfo => {
              const { name, citizenId, validdate } = idInfo;

              formInstance.setFieldsValue({
                name,
                citizenId,
                validdate,
              });
            });
          }
        }}
        />
      </Form.Item>

      <Form.Item
        label="管理员姓名"
        name="name"
        rules={[
          {
            required: true,
            message: '管理员姓名不能为空',
          },
          {
            max: 30,
            message: '姓名过长，不得超过30个字',
          },
        ]}
      >
        <Input placeholder="请保持与身份证件上的姓名一致" />
      </Form.Item>

      <Form.Item
        label="身份证件号"
        name="citizenId"
        required
        rules={[
          {
            async validator(rule, value) {
              if (!isIdentityCard(value)) {
                throw new Error('请输入正确的身份证号码');
              }
            },
          },
        ]}
      >
        <Input placeholder="请保持与身份证件上的证件号一致" />
      </Form.Item>

      <Form.Item
        label="有效截止日"
        name="validdate"
        required
        rules={[
          {
            async validator(rule, value) {
              if (!value?.[0] && !value?.[1]) {
                throw new Error('身份证件有效截止日期不能为空');
              }
            },
          },
        ]}
      >
        <FieldTermPick />
      </Form.Item>

      <Form.Item
        label="管理员手机号"
        name="mobile"
        required
        rules={[
          {
            async validator(rule, value) {
              if (!isMobilePhone(value)) {
                throw new Error('请输入正确的中国大陆11位手机号码');
              }
            },
          },
        ]}
      >
        <Input placeholder="请填写管理员手机号" />
      </Form.Item>

      <FormItemCaptcha placeholder="请查看手机短信，输入验证码" phoneName="mobile" />

      <Form.Item
        label="授权书"
        // name='authLetter'
        required
        rules={[
          {
            required: true,
            message: '当管理员与法人不一致的时候，请上传授权书',
          },
        ]}
        shouldUpdate
      >
        {() => {
          return (
            <Space className="auth-letter">
              <FieldUploadFile maxCount={1} listType="picture-card">上传1</FieldUploadFile>
              <div className="shop-license-pic">
                <p>1.当店铺管理员与法人不一致时，请上传管理员授权书</p>
                <p>
                  2.请使用模板下载后加盖公司印章后上传，
                  <span
                    className="down-load"
                    onClick={() => {
                      window.location.href = 'managerAuthHandbookUrl';
                    }}
                  >
                    下载模版
                  </span>
                </p>
                <p>3.支持上传1张文件，大小不得超过10MB</p>
                <p>4.格式支持JPG/JPEG/PNG/GIF/BPM</p>
              </div>
            </Space>
          );
        }}
      </Form.Item>
      {children}
    </Form>
  );
};

export default AdminForm;
