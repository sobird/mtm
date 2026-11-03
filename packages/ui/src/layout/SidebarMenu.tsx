import Link from 'next/link';
import type { ReactNode } from 'react';

import { cx } from '../cx';
import type { MenuNode } from './types';

import styles from './Sidebar.module.css';

function isActive(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}

function Icon({ name }: { name?: string }) {
  if (!name) {
    return <span className={styles.menuIcon} aria-hidden='true' />;
  }

  return (
    <span className={styles.menuIcon} aria-hidden='true'>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function MenuGroup({ item, children }: { item: MenuNode; children: ReactNode }) {
  return (
    <li className={styles.menuGroup}>
      <details open>
        <summary className={styles.menuGroupTitle}>
          <Icon name={item.icon} />
          <span>{item.title}</span>
        </summary>
        <ul className={styles.menuList}>{children}</ul>
      </details>
    </li>
  );
}

interface MenuTreeProps {
  items: MenuNode[];
  pathname: string;
  className?: string;
}

function MenuTree({ items, pathname, className }: MenuTreeProps) {
  return (
    <ul className={cx(styles.menuRoot, className)}>
      {items.map(item => {
        if (item.children && item.children.length > 0) {
          return (
            <MenuGroup key={item.id} item={item}>
              <MenuTree items={item.children} pathname={pathname} />
            </MenuGroup>
          );
        }

        return (
          <li key={item.id} className={styles.menuItem}>
            <Link
              className={cx(styles.menuLink, isActive(pathname, item.url) && styles.menuLinkActive)}
              href={item.url || '/'}
            >
              <Icon name={item.icon} />
              <span>{item.title}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export interface SidebarMenuProps {
  items: MenuNode[];
  pathname: string;
  className?: string;
}

/** Recursive navigation tree; leaves are rendered as `next/link` anchors. */
export function SidebarMenu({ items, pathname, className }: SidebarMenuProps) {
  return <MenuTree items={items} pathname={pathname} className={className} />;
}

export default SidebarMenu;
