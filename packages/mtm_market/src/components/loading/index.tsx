/**
 * 子应用中Suspense Loading 调用主应用Loading组件
 *
 * sobird<i@sobird.me> at 2023/10/02 18:55:45 created.
 */

import { useEffect, useContext } from 'react';
import { MasterContext } from '@/utils/context';

export default function Loading() {
  const { store, window } = useContext(MasterContext);

  useEffect(() => {
    window?.clearTimeout?.(window.microTimer);
    store?.dispatch({
      type: 'UPDATE_MICRO',
      payload: {
        loading: true,
      },
    });
    return () => {
      store?.dispatch({
        type: 'UPDATE_MICRO',
        payload: {
          loading: false,
        },
      });
    };
  }, []);
  return null;
}
