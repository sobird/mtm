'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { Card, Empty, Skeleton } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { MessageBriefDTO } from '@/lib/services/message';

import styles from './LatestNews.module.css';

export interface LatestNewsProps {
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  callback?: (data: MessageBriefDTO[]) => void;
}

export function LatestNews({ className, style, bodyStyle, callback }: LatestNewsProps) {
  const t = useTranslations('dashboard.latestNews');
  const tCommon = useTranslations('common');
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.analysis('latest-news'),
    queryFn: () => apiFetch<MessageBriefDTO[]>('/api/message/latest-news'),
  });

  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (data) {
      callbackRef.current?.(data);
    }
  }, [data]);

  const items = data ?? [];

  let content: ReactNode;

  if (isPending) {
    content = <Skeleton rows={3} />;
  } else if (isError) {
    content = <Empty description={tCommon('loadFailed')} />;
  } else if (items.length === 0) {
    content = <Empty description={t('empty')} />;
  } else {
    content = (
      <ul className={styles.list}>
        {items.map(item => (
          <li className={styles.brief} key={item.id}>
            <Link className={styles.title} href={`/site-notice/detail/${item.id}`}>
              {item.title}
            </Link>
            <span className={styles.date}>{item.publishTime ? dayjs(item.publishTime).format('MM-DD') : '--'}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div style={style}>
      <Card
        className={className}
        title={t('title')}
        extra={
          <Link className={styles.more} href='/site-notice/'>
            {t('more')}
          </Link>
        }
      >
        <div style={bodyStyle}>{content}</div>
      </Card>
    </div>
  );
}

export default LatestNews;
