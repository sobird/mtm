/**
 * useInterval.ts
 * 
 * sobird<i@sobird.me> at 2023/10/27 12:01:38 created.
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';

type ReturnType = [
  /** 清除计时 */
  () => void,
  /** 开始计时 */
  React.Dispatch<React.SetStateAction<number>>
];

const useInterval = (fn: () => void, delay?: number, options: { immediate?: boolean } = {}): ReturnType => {
  const [_delay, setdelay] = useState(delay);
  const timerCallback = useMemo(() => fn, [fn]);
  // eslint-disable-next-line no-undef
  const timerRef = useRef<NodeJS.Timer | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current as unknown as number);
    }
  }, []);

  useEffect(() => {
    if (!Number.isInteger(_delay) || _delay < 0) {
      return;
    }
    if (options.immediate) {
      timerCallback();
    }
    timerRef.current = setInterval(timerCallback, _delay);
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_delay, options.immediate]);

  return [clear, setdelay];
};

export default useInterval;
