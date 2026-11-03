'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect } from 'react';

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
  const { data, isPending } = useQuery({
    queryKey: queryKeys.analysis('latest-news'),
    queryFn: () => apiFetch<MessageBriefDTO[]>('/api/message/latest-news'),
  });

  useEffect(() => {
    if (data) {
      callback?.(data);
    }
  }, [data, callback]);

  const items = (data ?? []).slice(0, 3);

  let content: ReactNode;

  if (isPending) {
    content = <Skeleton rows={3} />;
  } else if (items.length === 0) {
    content = <Empty description='暂无最新动态' />;
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
        title='最新动态'
        extra={
          <Link className={styles.more} href='/site-notice/'>
            更多
          </Link>
        }
      >
        <div style={bodyStyle}>{content}</div>
      </Card>
    </div>
  );
}

export default LatestNews;
