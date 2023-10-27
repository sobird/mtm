import React, { useEffect } from 'react'
import { notification } from 'antd';

const Notifier = () => {
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    api.open({
      message: 'Notification Title',
      description:
        'I will never close automatically. This is a purposely very very long description that has many many characters and words.',
      duration: 0,
    });
  }, []);
  
  return (
    <>
      {contextHolder}
    </>
  )
}

export default Notifier