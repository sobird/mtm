/*
 * index.tsx
 * 
 * sobird<i@sobird.me> at 2023/06/30 20:42:08 created.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Steps, theme, Button, message, Result } from 'antd';
import LayoutEntry from "@/components/layout/entry";
import EntryEnumService, { IEntryEnum } from '@/services/merchant/entry/enum';
import EntryService from '@/services/merchant/entry';

import Step1 from './components/step1';
import Step2 from './components/step2';

import './index.scss';

function EntryCompany() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [option, setOption] = useState<IEntryEnum>();

  const steps = [
    {
      title: '填写主体信息',
      content: <Step1 option={option} form={form} />,
    },
    {
      title: '填写公司概况',
      content: <Step2 />,
    },
    {
      title: '填写资质信息',
      content: <Result status="warning" title="填写资质信息" />,
    },
    {
      title: '填写店铺信息',
      content: <Result status="warning" title="填写店铺信息" />,
    },
  ];

  useEffect(() => {
    EntryEnumService.get().then(res => {
      console.log('res', res)
      setOption(res);
    });

    EntryService.get().then(({customerInfo}) => {
      console.log('customerInfo', customerInfo)
      form.setFieldsValue({...customerInfo});
    });
  }, []);

  const { token } = theme.useToken();

  const next = () => {
    setCurrent(current + 1);

    form.submit();
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
    borderTop: `1px dashed ${token.colorBorder}`,
    padding: `10px 20px`,
  };

  return (
    <LayoutEntry>
      <div className="entry-company">
        <Steps size="small" className='company-steps' current={current} items={items} />
        <div style={contentStyle}>{steps[current].content}</div>

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
    </LayoutEntry>
  )
}

export default EntryCompany;
