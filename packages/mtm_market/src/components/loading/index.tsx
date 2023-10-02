/** 
 * 子应用中Suspense Loading 调用主应用Loading组件
 * 
 * sobird<i@sobird.me> at 2023/10/02 18:55:45 created.
 */

import { useEffect } from "react";

export default function Loading() {
  useEffect(() => {
    clearTimeout(window.$loadTimer);
    window.$store.dispatch({
      type: "UPDATE_MICRO",
      payload: {
        loading: true
      },
    });
    return () => {
      window.$store.dispatch({
        type: "UPDATE_MICRO",
        payload: {
          loading: false
        },
      });
    }
  }, []);
  return null;
}
