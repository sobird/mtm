/**
 * useIntersectionObserver.ts
 *
 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver
 *
 * sobird<i@sobird.me> at 2023/09/13 17:29:43 created.
 */

import React, { useEffect, useRef, PropsWithChildren } from 'react';

interface IUseIntersectionObserverProps {
  options?: object;
  threshold?: number;
  /**
   * 需要被监听的元素ID
   */
  id: string;
  callback: () => void;
}

const useIntersectionObserver: React.FC<PropsWithChildren<IUseIntersectionObserverProps>> = (
  {
    options = {}, threshold = 0.1, id, callback, children,
  },
) => {
  const observer = useRef<null | IntersectionObserver>();

  useEffect(() => {
    const target = document.getElementById(id);
    if (!id) {
      return;
    }

    const Options = {
      ...options,
      // 表示重叠面积占被观察者的比例，从 0 - 1 取值，1 表示完全被包含
      threshold,
    };

    const CallBack = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const radio = entry.intersectionRatio;
        const rect = entry.boundingClientRect;
        if (radio >= threshold && rect.y > 0) {
          const reported = target.getAttribute('reported');
          if (reported !== 'true') {
            callback?.();
            target.setAttribute('reported', 'true');
          }
        }
      });
    };

    observer.current = new IntersectionObserver(CallBack, Options);
    const ob = observer.current;
    if (target) {
      ob.observe(target);
    }

    return () => {
      if (observer?.current?.unobserve && target) {
        observer.current.unobserve(target);
      }
    };
  }, [options, threshold, id, callback]);

  return children;
};

export default useIntersectionObserver;
