'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { cx } from '../cx';
import { SidebarMenu } from './SidebarMenu';
import type { MenuNode } from './types';

import styles from './Sidebar.module.css';

export interface SidebarProps {
  title: string;
  menu: MenuNode[];
}

export function Sidebar({ title, menu }: SidebarProps) {
  const pathname = usePathname() ?? '/';
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cx(styles.sidebar, collapsed && styles.collapsed)}>
      <div className={styles.brand}>
        <Link href='/' className={styles.brandLink} title={title}>
          <span className={styles.brandMark} aria-hidden='true'>
            {title.slice(0, 1)}
          </span>
          <span className={styles.brandText}>{title}</span>
        </Link>
      </div>

      <div className={styles.scroll}>
        <nav className={styles.nav} aria-label='主菜单'>
          <SidebarMenu items={menu} pathname={pathname} />
        </nav>
      </div>

      <button
        type='button'
        className={styles.collapseButton}
        onClick={() => setCollapsed(value => !value)}
        aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
      >
        {collapsed ? <PanelLeftOpen size={16} aria-hidden='true' /> : <PanelLeftClose size={16} aria-hidden='true' />}
      </button>
    </aside>
  );
}

export default Sidebar;
