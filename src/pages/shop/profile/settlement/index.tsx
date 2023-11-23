/**
 * 店铺信息 - 结算信息
 *
 * sobird<i@sobird.me> at 2023/11/07 8:45:36 created.
 */

import { ConfigProvider, Form } from 'antd';
import { Card } from '@mtm/shared';
import './index.scss';

const formItemLayout = {
  labelCol: {
    flex: '0 0 85px',
  },
  wrapperCol: {
    span: 12,
  },
};

const ShopProfileSettlement = () => {
  // todo merchantDetail
  const initialValues = {
    cashDepositThreshold: 10000,
    settlementRate: 20,
  };
  return (
    <Card title="基本信息" bodyStyle={{ paddingTop: 16 }}>
      <ConfigProvider
        theme={{
          components: {
            Form: {
              itemMarginBottom: 0,
            },
          },
        }}
      >
        <Form initialValues={initialValues} {...formItemLayout}>
          <Form.Item label="保证金阈值" shouldUpdate>
            {({ getFieldValue }) => {
              return `${getFieldValue('cashDepositThreshold')}元`;
            }}
          </Form.Item>
          <Form.Item label="结算费率" shouldUpdate>
            {({ getFieldValue }) => {
              return `${getFieldValue('settlementRate')}%`;
            }}
          </Form.Item>

        </Form>
      </ConfigProvider>
    </Card>
  );
};

export default ShopProfileSettlement;
