/**
 * useTimeout.ts
 *
 * 由用户触发，在指定时间之后恢复状态，可以用来节流，比如一段时间内只能执行1次函数，避免重复点击触发
 *
 * sobird<i@sobird.me> at 2023/10/06 9:44:17 created.
 */

import { useState, useRef, useCallback } from 'react';

// number：时间，1000毫秒内只能触发一次事件
// count:次数，规定时间内可以触发的次数，默认是1次
// 1000:2 :传入这样的参数意味着1秒内最多可以触发2次这个事件
export default function useTimeout(number, count) {
  const [ready, setReady] = useState(false);
  let timerRef = useRef(null);
  let countRef = useRef(0);

  const start = useCallback(() => {
    if (countRef.current <= count) {
      setReady(true);
      countRef.current += 1;
    } else {
      setReady(false);
    }
    timerRef.current = setTimeout(() => {
      countRef.current -= 1;
      if (countRef.current <= count) {
        setReady(true);
      }
      // countRef.current=-1
    }, number);
  }, [number]);

  const stop = useCallback(() => {
    clearTimeout(timerRef.current);
  }, []);

  return [ready, start, stop];
}
