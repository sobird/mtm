'use client';

import { useQueryClient } from '@tanstack/react-query';
import { PanelLeftClose, PanelLeftOpen, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button, useToast } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { toggleFavorite } from '@/lib/menu/favorites';
import { queryKeys } from '@/lib/query-keys';
import type { MenuBadgeDTO, MenuItemDTO } from '@/lib/services/menu';
import { useUiStore } from '@/stores/ui';

import { SidebarMenu } from '../SidebarMenu';

import styles from './Sidebar.module.css';

export const MAX_FAVORITES = 10;

export interface SidebarProps {
  menuItems: MenuItemDTO[];
  favorites: MenuItemDTO[];
  badges: MenuBadgeDTO[];
}

function collectLeaves(items: MenuItemDTO[]): MenuItemDTO[] {
  const leaves: MenuItemDTO[] = [];

  for (const item of items) {
    if (item.children && item.children.length > 0) {
      leaves.push(...collectLeaves(item.children));
    } else {
      leaves.push(item);
    }
  }

  return leaves;
}

export function Sidebar({ menuItems, favorites, badges }: SidebarProps) {
  const collapsed = useUiStore(state => state.sidebarCollapsed);
  const toggleSidebar = useUiStore(state => state.toggleSidebar);
  const editMode = useUiStore(state => state.sidebarEditMode);
  const setEditMode = useUiStore(state => state.setSidebarEditMode);

  const [localFavorites, setLocalFavorites] = useState<MenuItemDTO[]>(favorites);
  const [seededFavorites, setSeededFavorites] = useState<MenuItemDTO[]>(favorites);
  const [saving, setSaving] = useState(false);

  const queryClient = useQueryClient();
  const toast = useToast();

  // Re-seed local edit state when the server-provided favorites change.
  if (favorites !== seededFavorites) {
    setSeededFavorites(favorites);
    setLocalFavorites(favorites);
  }

  const leaves = useMemo(() => collectLeaves(menuItems), [menuItems]);
  const favoriteIds = useMemo(() => new Set(localFavorites.map(item => item.id)), [localFavorites]);

  const toggle = (item: MenuItemDTO) => {
    try {
      setLocalFavorites(current => toggleFavorite(current, item, MAX_FAVORITES));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '收藏数量不能超过 10 个');
    }
  };

  const startEdit = () => {
    setLocalFavorites(favorites);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setLocalFavorites(favorites);
    setEditMode(false);
  };

  const save = async () => {
    setSaving(true);

    try {
      await apiFetch<MenuItemDTO[]>('/api/menu', {
        method: 'PATCH',
        body: { favorites: localFavorites.map(({ id }) => ({ id })) },
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.menu });
      setEditMode(false);
      toast.success('常用功能已保存');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.brand}>
        <Link href='/' className={styles.brandLink} title='美团电商商家管理后台'>
          <span className={styles.brandMark} aria-hidden='true'>
            美
          </span>
          <span className={styles.brandText}>商家管理后台</span>
        </Link>
      </div>

      <div className={styles.scroll}>
        <section className={styles.favorites}>
          <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>常用功能</h2>
            <button type='button' className={styles.manageButton} onClick={editMode ? cancelEdit : startEdit}>
              {editMode ? <Settings2 size={14} aria-hidden='true' /> : null}
              <span>{editMode ? '取消' : '管理'}</span>
            </button>
          </header>

          {editMode ? (
            <div className={styles.editPanel}>
              <p className={styles.hint}>
                已收藏 {localFavorites.length}/{MAX_FAVORITES}，点击下方功能入口添加或移除
              </p>
              <ul className={styles.favoriteList}>
                {localFavorites.map(item => (
                  <li key={item.id}>
                    <button type='button' className={styles.favoriteEditItem} onClick={() => toggle(item)}>
                      <span>{item.title}</span>
                      <span aria-hidden='true'>−</span>
                    </button>
                  </li>
                ))}
              </ul>
              <ul className={styles.candidateList}>
                {leaves.map(item => {
                  const added = favoriteIds.has(item.id);

                  return (
                    <li key={item.id}>
                      <button
                        type='button'
                        className={`${styles.candidateItem} ${added ? styles.candidateAdded : ''}`}
                        onClick={() => toggle(item)}
                      >
                        <span>{item.title}</span>
                        <span aria-hidden='true'>{added ? '−' : '+'}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Button size='sm' loading={saving} onClick={save}>
                保存
              </Button>
            </div>
          ) : (
            <>
              {localFavorites.length > 0 ? (
                <ul className={styles.favoriteList}>
                  {localFavorites.map(item => (
                    <li key={item.id}>
                      <Link className={styles.favoriteLink} href={item.url || '/'}>
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.hint}>暂无收藏，点击右上角“管理”添加</p>
              )}
            </>
          )}
        </section>

        <nav className={styles.nav} aria-label='主菜单'>
          <SidebarMenu items={menuItems} badges={badges} />
        </nav>
      </div>

      <button
        type='button'
        className={styles.collapseButton}
        onClick={toggleSidebar}
        aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
      >
        {collapsed ? <PanelLeftOpen size={16} aria-hidden='true' /> : <PanelLeftClose size={16} aria-hidden='true' />}
      </button>
    </aside>
  );
}

export default Sidebar;
