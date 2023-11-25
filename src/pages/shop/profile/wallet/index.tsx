import { Button, Tooltip } from 'antd';
import numeral from 'numeral';
// import WalletCard from '../../components/wallet-card';

import './index.scss';
import LabelValue from '@/components/label-value';

const fen2yuan = function fen2yuan(num: any) {
  if (typeof +num !== 'number' || Number.isNaN(+num)) {
    return null;
  }
  return (num / 100).toFixed(2);
};

// 钱包类型，1-企业钱包  2-个人钱包
export const walletTypeObj: { [key: string]: number } = {
  COMPANY: 1,
  PERSON: 2,
};

const ShopProfileWallet = () => {
  const wallet = {
    walletType: 1,
    currentWallet: true,
    remainAmount: 200,
    walletName: '小米妈妈',
    walletAccount: '小米妈妈家具旗舰店',
    bindingPhone: 15321871599,
    walletId: 123456,
    bankCardCount: 0,
    changeWallet: true,
  };
  const {
    walletType,
    currentWallet,
    remainAmount,
    walletName,
    walletAccount,
    bindingPhone,
    walletId,
    bankCardCount, // 是否绑定银行卡
    changeWallet,
  } = wallet;
  let gotoBankManageDom = null;
  if (currentWallet) {
    if (bankCardCount === 0) {
      gotoBankManageDom = (
        <div className="line-two">
          绑定银行卡后可正常使用提现业务，请前往
          <Button className="btn-text" style={{ marginTop: '-4px' }} type="text">绑定银行卡</Button>
        </div>
      );
    }
  } else {
    gotoBankManageDom = (<div className="line-two">如需提现，请先变更为当前使用</div>);
  }

  return (
    <div className="settle-info-container">

      {/* <WalletCard /> */}

      <div className={`wallet-box ${currentWallet ? 'current-wallet-box' : ''}`} key={`wallet-box-${walletId}`}>
        <div className="wallet-bar">
          <span className="wallet-name">
            <span>{walletType === 1 ? '企业钱包' : '个人钱包'}</span>
            {changeWallet ? <Button className="btn-text" type="text" onClick={() => { }}>{`${walletType === walletTypeObj.PERSON ? '更换为企业钱包' : '切换为当前使用'}`}</Button> : null}
          </span>
          <span className="wallet-tag"><span>{currentWallet ? '当前使用中' : '曾经使用过'}</span></span>
        </div>
        <div className="wallet-content">
          <div className="wallet-content-line-one">
            <div className="line-one">
              <div>
                <p className="remain-amount-des">钱包余额</p>
                <p className="remain-amount">
                  <span>¥</span>
                  <span>{numeral(fen2yuan(remainAmount)).format('0,0.00')}</span>
                </p>
              </div>
              {
                currentWallet ? (
                  <Tooltip
                    title={`${remainAmount === 0 ? '暂无余额' : ''}`}
                    trigger="hover"
                  >
                    <Button disabled={remainAmount === 0} style={{ width: '72px', paddingLeft: '0', paddingRight: '0' }}>去提现</Button>
                  </Tooltip>
                ) : null
              }
            </div>
            {gotoBankManageDom}
          </div>
          <div className="wallet-content-line-three">
            <div className="line-flex">
              <span>
                <span className="label">{walletType === walletTypeObj.COMPANY ? '企业名称:' : '姓名:'}</span>
                <Tooltip
                  title={`${walletType === walletTypeObj.COMPANY && walletName?.length > 13 ? walletName : ''}`}
                  trigger="hover"
                >
                  <span className="con spill-over">{walletName}</span>
                </Tooltip>
              </span>
              <span>
                <span className="label">钱包账号:</span>
                <span className="con">{walletAccount}</span>
              </span>

              <LabelValue label="绑定手机" value="15321871599" />
            </div>
            <div className="line-flex">
              <span>
                <span className="label">绑定手机:</span>
                <span className="con">{bindingPhone}</span>
                {currentWallet ? <Button style={{ marginTop: '-3px' }} type="text" className="btn-text">去修改</Button> : null}
              </span>
              <span>
                <span className="label">钱包ID:</span>
                <span className="con">{walletId}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`wallet-box ${currentWallet ? 'current-wallet-box' : ''}`} key={`wallet-box-${walletId}`}>
        <div className="wallet-bar">
          <span className="wallet-name">
            <span>{walletType === 1 ? '企业钱包' : '个人钱包'}</span>
            {changeWallet ? <Button className="btn-text" type="text" onClick={() => { }}>{`${walletType === walletTypeObj.PERSON ? '更换为企业钱包' : '切换为当前使用'}`}</Button> : null}
          </span>
          <span className="wallet-tag"><span>{currentWallet ? '当前使用中' : '曾经使用过'}</span></span>
        </div>
        <div className="wallet-content">
          <div className="wallet-content-line-one">
            <div className="line-one">
              <div>
                <p className="remain-amount-des">钱包余额</p>
                <p className="remain-amount">
                  <span>¥</span>
                  <span>{numeral(fen2yuan(remainAmount)).format('0,0.00')}</span>
                </p>
              </div>
              {
                currentWallet ? (
                  <Tooltip
                    title={`${remainAmount === 0 ? '暂无余额' : ''}`}
                    trigger="hover"
                  >
                    <Button disabled={remainAmount === 0} style={{ width: '72px', paddingLeft: '0', paddingRight: '0' }}>去提现</Button>
                  </Tooltip>
                ) : null
              }
            </div>
            {gotoBankManageDom}
          </div>
          <div className="wallet-content-line-three">
            <div className="line-flex">
              <span>
                <span className="label">{walletType === walletTypeObj.COMPANY ? '企业名称:' : '姓名:'}</span>
                <Tooltip
                  title={`${walletType === walletTypeObj.COMPANY && walletName?.length > 13 ? walletName : ''}`}
                  trigger="hover"
                >
                  <span className="con spill-over">{walletName}</span>
                </Tooltip>
              </span>
              <span>
                <span className="label">钱包账号:</span>
                <span className="con">{walletAccount}</span>
              </span>
            </div>
            <div className="line-flex">
              <span>
                <span className="label">绑定手机:</span>
                <span className="con">{bindingPhone}</span>
                {currentWallet ? <Button style={{ marginTop: '-3px' }} type="text" className="btn-text">去修改</Button> : null}
              </span>
              <span>
                <span className="label">钱包ID:</span>
                <span className="con">{walletId}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopProfileWallet;
