import React from 'react';
import { useNavigate } from 'react-router-dom'
import { Button } from 'antd';

interface NoneSupportProps {
  text?: string;
}

const NoneSupport: React.FC<NoneSupportProps> = ({ text }) => {
  const navigate = useNavigate();
  return (
    <Button
      onClick={() => {
        navigate(-1)
      }}
    >
          我知道了
    </Button>
  );
}

export default NoneSupport;
