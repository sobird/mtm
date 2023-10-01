/**
 * 用户登录页面
 *
 * sobird<i@sobird.me> at 2023/06/12 8:24:06 created.
 */
import { Button } from 'antd'
import Base from "@/layout/base";

import './index.scss';

function SettleInpc() {
  
  return (
    <Base hasBackground={false} hasWindow={false}>
      <div className="settle-pc">
        <div className='box'>抱歉，您当前登陆的手机号已经注册过店铺，请先点击退出登陆，然后更换一个新的手机号重新注册登陆即可。给您带来不便，还请谅解。</div>
        <Button type='primary'>退出登录</Button>
      </div>
    </Base>
  )
}

export default SettleInpc;
