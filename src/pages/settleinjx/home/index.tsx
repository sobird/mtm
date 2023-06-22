/*
 * index.tsx
 * 
 * sobird<i@sobird.me> at 2023/06/22 22:41:07 created.
 */


import { Button, Dropdown } from 'antd';
import Entry from "@/components/layout/entry";

import './index.scss';

function EntryHome() {
  
  return (
    <Entry>
      <div className="settle-pc">
        <div className='box'>抱歉，您当前登陆的手机号已经注册过店铺，请先点击退出登陆，然后更换一个新的手机号重新注册登陆即可。给您带来不便，还请谅解。</div>
        <Button type='primary'>退出登录</Button>
      </div>
    </Entry>
  )
}

export default EntryHome;
