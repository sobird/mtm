/**
 * useInterval.ts
 * 
 * sobird<i@sobird.me> at 2023/10/27 12:01:38 created.
 */

import { useMemo, useCallback, useEffect, useRef } from 'react';

const useInterval = (fn: () => void, delay?: number, options: { immediate?: boolean } = {}) => {
  const timerCallback = useMemo(() => fn, [fn]);
  // eslint-disable-next-line no-undef
  const timerRef = useRef<NodeJS.Timer | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current as unknown as number);
    }
  }, []);

  useEffect(() => {
    if (!Number.isInteger(delay) || delay < 0) {
      return;
    }
    if (options.immediate) {
      timerCallback();
    }
    timerRef.current = setInterval(timerCallback, delay);
    return clear;
  }, [delay, options.immediate]);

  return clear;
};

export default useInterval;
