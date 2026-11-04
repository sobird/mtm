'use client';

import { translateUiKey } from '@mtm/i18n';
import { PanelLeftClose, PanelLeftOpen, Settings2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Button, useToast } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { MAX_FAVORITES, toggleFavorite } from '@/lib/menu/favorites';
import type { MenuBadgeDTO, MenuItemDTO } from '@/lib/services/menu';
import { translateApiError } from '@/lib/translate-api-error';
import { useUiStore } from '@/stores/ui';

import { SidebarMenu } from '../SidebarMenu';

import styles from './Sidebar.module.css';

export { MAX_FAVORITES };

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
  const t = useTranslations();
  const collapsed = useUiStore(state => state.sidebarCollapsed);
  const toggleSidebar = useUiStore(state => state.toggleSidebar);
  const editMode = useUiStore(state => state.sidebarEditMode);
  const setEditMode = useUiStore(state => state.setSidebarEditMode);

  const [localFavorites, setLocalFavorites] = useState<MenuItemDTO[]>(favorites);
  const [savedFavorites, setSavedFavorites] = useState<MenuItemDTO[]>(favorites);
  const [seededFavorites, setSeededFavorites] = useState<MenuItemDTO[]>(favorites);
  const [saving, setSaving] = useState(false);

  const router = useRouter();
  const toast = useToast();

  // Re-seed local edit state when the server-provided favorites change. A
  // refresh while editing must not clobber the in-progress selection.
  if (favorites !== seededFavorites) {
    setSeededFavorites(favorites);
    setSavedFavorites(favorites);
    if (!editMode) {
      setLocalFavorites(favorites);
    }
  }

  const leaves = useMemo(() => collectLeaves(menuItems), [menuItems]);
  const favoriteIds = useMemo(() => new Set(localFavorites.map(item => item.id)), [localFavorites]);

  const toggle = (item: MenuItemDTO) => {
    try {
      // Compute outside the state updater: React cannot catch a throw raised
      // while re-rendering, which would take down the whole shell.
      setLocalFavorites(toggleFavorite(localFavorites, item, MAX_FAVORITES));
    } catch (error) {
      toast.error(translateApiError(error, t, 'errors.MAX_FAVORITES'));
    }
  };

  const startEdit = () => {
    setLocalFavorites(savedFavorites);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setLocalFavorites(savedFavorites);
    setEditMode(false);
  };

  const save = async () => {
    setSaving(true);

    try {
      await apiFetch<MenuItemDTO[]>('/api/menu', {
        method: 'PATCH',
        body: { favorites: localFavorites.map(({ id }) => ({ id })) },
      });
      setSavedFavorites(localFavorites);
      setEditMode(false);
      // The menu arrives as RSC props, so refresh the layout to re-run getMenu;
      // TanStack invalidation has nothing to invalidate here.
      router.refresh();
      toast.success(t('common.favoritesSaved'));
    } catch (error) {
      toast.error(translateApiError(error, t, 'common.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.brand}>
        <Link href='/' className={styles.brandLink} title={t('common.appTitle.merchant')}>
          <span className={styles.brandMark} aria-hidden='true'>
            {t('common.brandMark')}
          </span>
          <span className={styles.brandText}>{t('common.brandShort')}</span>
        </Link>
      </div>

      <div className={styles.scroll}>
        <section className={styles.favorites}>
          <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('common.favorites')}</h2>
            <button type='button' className={styles.manageButton} onClick={editMode ? cancelEdit : startEdit}>
              {editMode ? <Settings2 size={14} aria-hidden='true' /> : null}
              <span>{editMode ? t('common.cancel') : t('common.manage')}</span>
            </button>
          </header>

          {editMode ? (
            <div className={styles.editPanel}>
              <p className={styles.hint}>
                {t('common.favoritesHint', { count: localFavorites.length, max: MAX_FAVORITES })}
              </p>
              <ul className={styles.favoriteList}>
                {localFavorites.map(item => (
                  <li key={item.id}>
                    <button type='button' className={styles.favoriteEditItem} onClick={() => toggle(item)}>
                      <span>{translateUiKey(item.title, t)}</span>
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
                        <span>{translateUiKey(item.title, t)}</span>
                        <span aria-hidden='true'>{added ? '−' : '+'}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Button size='sm' loading={saving} onClick={save}>
                {t('common.save')}
              </Button>
            </div>
          ) : (
            <>
              {localFavorites.length > 0 ? (
                <ul className={styles.favoriteList}>
                  {localFavorites.map(item => (
                    <li key={item.id}>
                      <Link className={styles.favoriteLink} href={item.url || '/'}>
                        {translateUiKey(item.title, t)}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.hint}>{t('common.noFavorites')}</p>
              )}
            </>
          )}
        </section>

        <nav className={styles.nav} aria-label={t('common.mainMenu')}>
          <SidebarMenu items={menuItems} badges={badges} />
        </nav>
      </div>

      <button
        type='button'
        className={styles.collapseButton}
        onClick={toggleSidebar}
        aria-label={collapsed ? t('common.expandSidebar') : t('common.collapseSidebar')}
      >
        {collapsed ? <PanelLeftOpen size={16} aria-hidden='true' /> : <PanelLeftClose size={16} aria-hidden='true' />}
      </button>
    </aside>
  );
}

export default Sidebar;
