import React from 'react';
import { useNavigate } from 'react-router-dom'
import { Button, Result } from 'antd';

export interface NoneSupportProps {
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
    />
  );
}

export default NoneSupport;
