import React, { useEffect } from 'react'
import { notification } from 'antd';
import useInterval from '@/hooks/useInterval';
import CommonService from '@/services/common';

const Notifier = () => {
  const [api, contextHolder] = notification.useNotification();

  useInterval(() => {
    console.log('useInterval', +new Date)

    CommonService.version().then(res => {
      console.log('res', res)
    })

  }, 5000);


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