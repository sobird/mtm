import React from 'react';
import { useNavigate } from 'react-router-dom'
import { Button } from 'antd';
import Result from 'antd/es/result';

interface NoneSupportProps {
  text?: string;
}

const NoneSupport: React.FC<NoneSupportProps> = ({ text }) => {
  const navigate = useNavigate();
  return (
    <Result
      title={text || '功能即将上线'}
      extra={(
        <Button
          onClick={() => {
            navigate(-1)
          }}
        >
          我知道了
        </Button>
      )}
    ></Result>
  );
}

export default NoneSupport;
