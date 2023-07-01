/*
 * index.tsx
 * 
 * sobird<i@sobird.me> at 2023/06/30 20:42:08 created.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Steps, theme, Button, message, Card } from 'antd';
import Entry from "@/components/layout/entry";
import Invitation, { IInvitationRequestData } from '@/services/common/invitation';
import EntryEnumService from '@/services/merchant/entry/enum';

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

  useEffect(() => {
    EntryEnumService.get().then(res => {
      console.log('res', res)
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
            <p>Card content</p>
            <p>Card content</p>
            <p>Card content</p>
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
            Done
            </Button>
          )}
        </div>
      </div>
    </Entry>
  )
}

export default EntryCompany;
