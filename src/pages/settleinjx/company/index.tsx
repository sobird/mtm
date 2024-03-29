/*
 * index.tsx
 *
 * sobird<i@sobird.me> at 2023/06/30 20:42:08 created.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form, Steps, theme, Button, message, Result,
} from 'antd';
import LayoutEntry from '@/layout/entry';
import MerchantService, { IMerchantOptions } from '@/services/merchant';

import Step1 from './components/step1';
import Step2 from './components/step2';

import './index.scss';

function EntryCompany() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [option, setOption] = useState<IMerchantOptions>();

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
    MerchantService.options().then((res) => {
      setOption(res);
    });

    MerchantService.entryDetail().then(({ company }) => {
      form.setFieldValue('company', company);
    });
  }, []);

  const { token } = theme.useToken();

  const next = () => {
    setCurrent(current + 1);

    form.submit();
  };

  const prev = () => {
    if (current === 0) {
      navigate('/settleinjx/shop');
      return;
    }
    setCurrent(current - 1);
  };

  const items = steps.map((item) => { return { key: item.title, title: item.title }; });

  const contentStyle: React.CSSProperties = {
    borderTop: `1px dashed ${token.colorBorder}`,
    padding: '10px 20px',
  };

  return (
    <LayoutEntry>
      <div className="entry-company">
        <Steps size="small" className="company-steps" current={current} items={items} />
        <div style={contentStyle}>{steps[current].content}</div>

        <div className="entry-footer">
          <Button style={{ margin: '0 20px' }} onClick={() => { return prev(); }}>
            上一步
          </Button>
          {current < steps.length - 1 && (
            <Button type="primary" onClick={() => { return next(); }}>
              下一步
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button type="primary" onClick={() => { return message.success('Processing complete!'); }}>
              完成
            </Button>
          )}
        </div>
      </div>
    </LayoutEntry>
  );
}

export default EntryCompany;
