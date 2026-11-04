import { translateUiKey } from '@mtm/i18n';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations();

  return (
    <li className={styles.menuGroup}>
      <details open>
        <summary className={styles.menuGroupTitle} data-testid={`menu-${item.id}`}>
          <Icon name={item.icon} />
          <TitleWithBadge title={translateUiKey(item.title, t)} badge={badge} />
        </summary>
        <ul className={styles.menuList}>{children}</ul>
      </details>
    </li>
  );
}

interface MenuTreeProps {
  items: MenuItemDTO[];
  badgeMap: Map<string, MenuBadgeDTO>;
  className?: string;
}

function MenuTree({ items, badgeMap, className }: MenuTreeProps) {
  const t = useTranslations();

  return (
    <ul className={[styles.menuRoot, className].filter(Boolean).join(' ')}>
      {items.map(item => {
        const badge = badgeMap.get(item.id);

        if (item.children && item.children.length > 0) {
          return (
            <MenuGroup key={item.id} item={item} badge={badge}>
              <MenuTree items={item.children} badgeMap={badgeMap} />
            </MenuGroup>
          );
        }

        return (
          <li key={item.id} className={styles.menuItem}>
            <Link className={styles.menuLink} href={item.url || '/'} data-testid={`menu-${item.id}`}>
              <Icon name={item.icon} />
              <TitleWithBadge title={translateUiKey(item.title, t)} badge={badge} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Recursive navigation tree; leaves are rendered as `next/link` anchors. */
export function SidebarMenu({ items, badges, className }: SidebarMenuProps) {
  const badgeMap = new Map(badges.map(badge => [badge.menuId, badge]));

  return <MenuTree items={items} badgeMap={badgeMap} className={className} />;
}

export default SidebarMenu;
