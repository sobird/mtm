/**
 * 更改钱包前置校验
 * 
 * @todo
 * 验证码组件
 * 
 * sobird<i@sobird.me> at 2023/10/29 11:04:20 created.
 */

import React from 'react'
import { Modal, Alert, Steps } from 'antd'

const WalletAuth = () => {
  const active = 1;
  return (
    <Modal title="变更为个人钱包" open={true}>
      <Alert
        message="更换钱包，原钱包余额不会自动转入新钱包，建议先提现再更换"
        type="warning"
        showIcon
      />

      <Steps
        items={[{title: '管理员认证'}, {title: '确认钱包信息'}]}
        className="steps-box"
      />

      <div className="change-wallet-content">
        <div className="sms-code-box">
          {
            // active === 1 ? <SmsForm config={config} ref={this.ref2} errorMsg={this.state.errorMsg || ''} setErrorMsg={this.setErrorMsg} /> : null
          }
        </div>
      </div>
    </Modal>
  )
}

export default WalletAuth