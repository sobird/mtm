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
  if (!badge) {
    return <>{title}</>;
  }

  const { noticeStyle, noticeContent } = badge;

  if (noticeStyle === 30) {
    return (
      <span>
        {title}
        {noticeContent ? <Tag tone='success'>{noticeContent}</Tag> : null}
      </span>
    );
  }

  if (noticeStyle === 20) {
    return (
      <span>
        {title}
        {noticeContent ? <Badge tone='danger'>{noticeContent}</Badge> : null}
      </span>
    );
  }

  return (
    <span>
      {title}
      <Badge tone='danger'>•</Badge>
    </span>
  );
}

export default TitleWithBadge;
