/**
 * 商户注册成功页
 *
 * sobird<i@sobird.me> at 2023/06/20 12:47:45 created.
 */

import { useNavigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import Base from '@/layout/base';

function RegisterSuccess() {
  const navigate = useNavigate();
  return (
    <Base hasBackground={false} hasWindow={false}>
      <Result
        status="success"
        title="注册成功"
        subTitle="恭喜您已成功注册美团商户，请遵守当地法律法规。"
        extra={[
          <Button
            type="primary"
            onClick={() => {
              navigate('/login');
            }}
          >
            去登录
          </Button>,
          <Button onClick={() => {
            navigate('/register');
          }}
          >
            返回
          </Button>,
        ]}
      />
    </Base>
  );
}

export default RegisterSuccess;
