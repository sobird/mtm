'use client';

import { translateUiKey } from '@mtm/i18n';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Badge, Tag } from '@/components/ui';
import type { MenuBadgeDTO } from '@/lib/services/menu';

export interface TitleWithBadgeProps {
  title: ReactNode;
  badge?: MenuBadgeDTO | null;
}

/**
 * Renders a menu title with an optional notice badge.
 *
 * Legacy notice styles: 10 = dot, 20 = numeric count, 30 = inline status text.
 */
export function TitleWithBadge({ title, badge }: TitleWithBadgeProps) {
  const t = useTranslations();

  if (!badge) {
    return <>{title}</>;
  }

  const { noticeStyle, noticeContent } = badge;
  const content = noticeContent ? translateUiKey(noticeContent, t) : null;

  if (noticeStyle === 30) {
    return (
      <span>
        {title}
        {content ? <Tag tone='success'>{content}</Tag> : null}
      </span>
    );
  }

  if (noticeStyle === 20) {
    return (
      <span>
        {title}
        {content ? <Badge tone='danger'>{content}</Badge> : null}
      </span>
    );
  }

  return (
    <span>
      {title}
      <span aria-hidden='true'>
        <Badge tone='danger'>•</Badge>
      </span>
    </span>
  );
}

export default TitleWithBadge;
