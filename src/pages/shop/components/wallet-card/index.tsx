/**
 * 店铺钱包卡片 组件
 *
 * sobird<i@sobird.me> at 2023/10/28 13:41:29 created.
 */

import { FC } from 'react';
import classNames from 'classnames';
import {
  Row, Button, Tag,
} from 'antd';
import { Card } from '@mtm/shared';
import numeral from '@/utils/numeral';
import LabelValue from '@/components/label-value';
import WalletAuth from '../wallet-auth';

import './index.scss';

interface WalletCardProps {
  /** 钱包账号 */
  account: string;
  /** 钱包名称 */
  // name: string;
  /** 钱包类型 */
  type: 1 | 2;
  /** 当前使用中 */
  current: boolean;
  /** 钱包余额 */
  balance: number;
  /** 绑定的手机号 */
  bindingPhone: string | number;
  /** 绑定的银行卡号 */
  bindingBankCardNum: string | number;
}

const WalletCard: FC<WalletCardProps> = ({
  account, type, current = true, balance, bindingBankCardNum,
}) => {
  let walletNote = null;
  if (current) {
    if (!bindingBankCardNum) {
      walletNote = (
        <div className="wallet-note">
          绑定银行卡后可正常使用提现业务，请前往
          <Button className="btn-txt-sm" size="small" type="text">
            绑定银行卡
          </Button>
        </div>
      );
    }
  } else {
    walletNote = <div className="wallet-note">如需提现，请先变更为当前使用</div>;
  }

  return (
    <Card
      className={classNames('wallet-card', {
        'wallet-card-current': current,
      })}
      headStyle={{
        margin: '0 -16px',
        padding: '0 16px',
        backgroundColor: 'var(--card-background)',
      }}
      title="企业钱包"
      subTitle={(
        <Button type="text" size="small" style={{ fontSize: 12 }}>
          切换为当前使用
        </Button>
      )}
      extra={(
        <Tag bordered={false} color="processing" style={{ margin: 0 }}>
          <span>{current ? '当前使用中' : '曾经使用过'}</span>
        </Tag>
      )}
    >
      <div className="wallet-balance">
        <div className="wallet-balance-row">
          <div className="wallet-balance-col">
            <div className="wallet-balance-label">钱包余额</div>
            <div className="wallet-balance-value">
              <span className="wallet-balance-value-unit">¥</span>
              <span className="wallet-balance-value-text">{numeral(balance).format('0.00')}</span>
            </div>
          </div>
          <Button>去提现</Button>
        </div>

        {walletNote}
      </div>

      <div className="wallet-meta">
        <Row justify="space-between">
          <LabelValue label={type === 1 ? '企业名称' : '姓名'} value="小米妈妈" />
          <LabelValue label="钱包账号" value={`${account}小米妈妈`} />
        </Row>

        <Row justify="space-between">
          <LabelValue label="绑定手机" value="15321871599" />
          <LabelValue label="钱包ID" value="123456" />
        </Row>
      </div>

      <WalletAuth />
    </Card>
  );
};

export default WalletCard;
