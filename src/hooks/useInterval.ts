/**
 * useInterval
 *
 * @see https://github.com/alibaba/hooks/blob/master/packages/hooks/src/useInterval/index.ts
 * @see https://github.com/vueuse/vueuse/tree/main/packages/shared/useIntervalFn
 *
 * sobird<i@sobird.me> at 2023/10/27 12:01:38 created.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

type ReturnType = (time: null | undefined | number) => void;

export interface UseIntervalOptions {
  /**
   * Execute the callback immediate after calling this function
   *
   * @default true
   */
  immediate?: boolean;
}

const useInterval = (fn: () => void, delay?: number, options: UseIntervalOptions = {}): ReturnType => {
  const { immediate = false } = options;
  const [runEffect, setRunEffect] = useState(true);
  const [time, setTime ] = useState(delay);

  const timerCallback = useMemo(() => fn, [fn]);
  // eslint-disable-next-line no-undef
  const timerRef = useRef<NodeJS.Timer | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current as unknown as number);
    }
  }, []);

  useEffect(() => {
    if (!Number.isInteger(time) || time < 0 ) {
      return;
    }
    if (immediate) {
      timerCallback();
    }

    timerRef.current = setInterval(timerCallback, time);
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, immediate, runEffect]);

  return (time = 1000) => {
    setTime(time);
    setRunEffect(v => !v);
  };
};

export default useInterval;
