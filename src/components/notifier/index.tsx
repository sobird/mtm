import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'
import { notification } from 'antd';
import useInterval from '@/hooks/useInterval';
import CommonService from '@/services/common';

import './index.scss';

const message = (setSearchParams, config) => {
  return (<>系统已更新，请及时刷新页面 <button onClick={() => {
    setSearchParams(searchParams => {
      searchParams.set('v', config.version)
      return searchParams;
    });

    window.location.reload();
  }} className="notifier-update-btn">立即更新</button></>)
  
}
const Notifier = () => {
  const [api, contextHolder] = notification.useNotification();
  const [, setSearchParams] = useSearchParams();

  useInterval(() => {
    CommonService.version().then(res => {
      if(window.config.version !== res.version) {
        api.open({
          message: message(setSearchParams, res),
          // description: '系统已更新，请及时刷新页面。',
          duration: 0,
          className: 'mix-notifier',
          placement: "bottomRight",
          style: {
            width: 270,
          },
        });
      }

    });
  }, window.config.checkInterval || 300000);

  return <>{contextHolder}</>;
};

export default Notifier;
