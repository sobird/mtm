/**
 * 商户注册成功页
 * 
 * sobird<i@sobird.me> at 2023/06/20 12:47:45 created.
 */

import Base from "@/components/layout/base";
import { Result, Button } from 'antd'

function RegisterSuccess() {
  
  return (
    <Base hasBackground={false} hasWindow={false}>
      <Result 
        status="success"
        title="注册成功"
        subTitle="恭喜您已成功注册美团商户"
        extra={[
          <Button type="primary">去登录</Button>,
          <Button>返回</Button>,
        ]}></Result>
    </Base>
  )
}

export default RegisterSuccess;