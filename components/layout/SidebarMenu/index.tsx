import Link from 'next/link';
import type { ReactNode } from 'react';

import type { MenuBadgeDTO, MenuItemDTO } from '@/lib/services/menu';

import { TitleWithBadge } from '../TitleWithBadge';

import styles from '../Sidebar/Sidebar.module.css';

export interface SidebarMenuProps {
  items: MenuItemDTO[];
  badges: MenuBadgeDTO[];
  className?: string;
}

function Icon({ name }: { name: string }) {
  if (!name) {
    return <span className={styles.menuIcon} aria-hidden='true' />;
  }

  return (
    <span className={styles.menuIcon} aria-hidden='true'>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function MenuGroup({ item, badge, children }: { item: MenuItemDTO; badge?: MenuBadgeDTO; children: ReactNode }) {
  return (
    <li className={styles.menuGroup}>
      <details open>
        <summary className={styles.menuGroupTitle}>
          <Icon name={item.icon} />
          <TitleWithBadge title={item.title} badge={badge} />
        </summary>
        <ul className={styles.menuList}>{children}</ul>
      </details>
    </li>
  );
}

/** Recursive navigation tree; leaves are rendered as `next/link` anchors. */
export function SidebarMenu({ items, badges, className }: SidebarMenuProps) {
  const badgeMap = new Map(badges.map(badge => [badge.menuId, badge]));

  return (
    <ul className={[styles.menuRoot, className].filter(Boolean).join(' ')}>
      {items.map(item => {
        const badge = badgeMap.get(item.id);

        if (item.children && item.children.length > 0) {
          return (
            <MenuGroup key={item.id} item={item} badge={badge}>
              <SidebarMenu items={item.children} badges={badges} />
            </MenuGroup>
          );
        }

        return (
          <li key={item.id} className={styles.menuItem}>
            <Link className={styles.menuLink} href={item.url || '/'}>
              <Icon name={item.icon} />
              <TitleWithBadge title={item.title} badge={badge} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default SidebarMenu;
