/**
 * 店铺基本信息
 *
 * sobird<i@sobird.me> at 2023/10/25 19:32:29 created.
 */

import React, {useState} from 'react';
import { Form, Button, Input } from 'antd';
import FieldMerchantLogo from '@/components/field-merchant-logo';
import './index.scss';

const blankText = '暂未填写';

const value = '';

const formItemLayout = {
  labelCol: {
    flex: '0 0 142px',
  },
};

function BaseInfo() {
  const [editable, setEditable] = useState(true);
  const [form] = Form.useForm();

  const basicData = {

  };

  const submitForm = () => {
    // todo 
  }

  return <div className="shop-baseinfo-panel">
    <Form
      className="shop-base-form"
      {...formItemLayout}
      // ref={this.formRef}
      // value={formValue}
      onFinish={(value) => {
        if (!value) {
          // this.submit(value, formValue); // 提交数据
        }
      }}
    >
      {/* <div className="toolbar" style={{ marginBottom: '11px' }}>
          <div className="title">基础信息</div>
          {
            editable
              ? (
                <div>
                  <Button type="hollow" style={{ height: '32px', width: '52px', fontSize: 12 }} onClick={() => this.cancle(resetForm, validateForm, setFieldValues, formValue)}>取消</Button>
                  <Button
                    type="default" style={{
                      height: '32px', width: '52px', fontSize: 12, marginLeft: '10px',
                    }} onClick={submitForm}
                  >保存</Button>
                </div>
              )
              : <Button type="default" style={{ height: '32px', width: '52px', fontSize: 12 }} onClick={() => this.changeEditable(true)}>编辑</Button>
          }
        </div> */}

      <Form.Item
        label="店铺编号"
        name="shopId"
      >
    
        <div className={value ? 'textRow' : 'textRow textRow-blank'} style={{ display: 'flex', alignItems: 'center' }}>
          <span
            className="textRow-text"
            style={{ marginTop: '-1px' }}
            id='shopId'
          >
            123456
          </span>
          { <Button  className="clipboard" data-clipboard-target="#shopId" type="text" style={{ marginTop: '-1px' }}>复制</Button>}
        </div>

      </Form.Item>
        
      <Form.Item
        label="店铺名称"
        name="shopName"
      >
        <div className={value ? 'textRow' : 'textRow textRow-blank'}>
          <div className="textRow-text">{value || blankText}</div>
        </div>
      </Form.Item>
        
      <Form.Item
        label="店铺类型"
        name="merchantType"
      >
        <div className={value ? 'textRow' : 'textRow textRow-blank'}>
          <div className="textRow-text">{"企业专营店铺" || blankText}</div>
        </div>
      </Form.Item>
        
      <Form.Item
        label="主营类目"
        name="mainCategoryText"
      >
        <div className={value ? 'textRow' : 'textRow textRow-blank'}>
          <div className="textRow-text">{value || '请联系招商经理，确认该店铺的主营类目' }</div>
        </div>
      </Form.Item>
        
      <Form.Item
        label="店铺标志"
        name="logo"
        required
        // type="logo"
        // rule={{
        //   validator: (rule: ruleprops, value: string, callback: () => void) => {
        //     this.logoValidator(rule, value, callback);
        //   },
        // }}
      >
        {!{logo: 1}.logo && !editable ? (
          <span className="textRow textRow-blank">
            <div className="textRow-text">{blankText}</div>
          </span>

        ) : 
          <FieldMerchantLogo
            // value={}
            // onChange={handleChange}
            status={1}
            rejectReason={['拒绝原因']}
            editable={editable}
            // setDelRejectFlag={}
            delRejectFlag={true}
          />
        }
      </Form.Item>
        
      <Form.Item
        label="店铺简介"
        name="desc"
        // rule={{
        //   validator: (rule: ruleprops, value: string, callback: () => void) => {
        //     this.descValidator(rule, value, callback);
        //   },
        // }}
      >
        {
          (
            editable
              ? (
                <div className="desc-wrapper">
                  <Input.TextArea
                    placeholder="填写店铺简介，可让消费者更了解您的店铺"
                    // value={value}
                    className="desc"
                    // onChange={handleChange}
                    // statistics
                    maxLength={200}
                    // resize="horizontal"
                    rows={5}
                    cols={40}
                  />
                </div>
              )
              : (
                <div className={value ? 'textRow' : 'textRow textRow-blank'} style={{ fontSize: '14px', width: '800px' }}>
                  <div className="textRow-text">{value || blankText}</div>
                </div>
              )
          )
        }
      </Form.Item>
          
      <Form.Item
        label="第三方平台店铺链接"
        name="externLinks"
        // rule={{
        //   validator: (rule: ruleprops, value: string, callback: () => void) => {
        //     this.externLinksValidator(rule, value, callback);
        //   },
        // }}
      >
        {
          editable
            ? <Input className="extra-links" placeholder="填写真实的其他平台店铺链接" />
            : 
            <div className={value ? 'textRow' : 'textRow textRow-blank'} style={{ fontSize: '14px' }}>
              <div className="textRow-text">{value || blankText}</div>
            </div>
        }
      </Form.Item>
    </Form>
  </div>;
}

export default BaseInfo;
