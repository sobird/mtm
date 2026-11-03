import { filterMenuTree } from '@mtm/auth/menu-filter';

import { prisma } from '@/lib/db';
import type { MenuItem } from '@/lib/generated/prisma';
import { listToTree } from '@/lib/menu-tree';

import { AppError } from '../errors';
import { getAccountPermissions } from './permission';

export interface MenuItemDTO {
  title: string;
  icon: string;
  url: string;
  id: string;
  parentId: string;
  code: string;
  auth: boolean;
  index: number;
  level: number;
  sortId: number;
  toolMenu: boolean;
  permissionCode: string | null;
  children?: MenuItemDTO[];
  last?: boolean;
}

export interface MenuBadgeDTO {
  menuId: string;
  actionType: number | null;
  noticeStyle: number | null;
  noticeContent: string | null;
}

export interface MenuDTO {
  menuItems: MenuItemDTO[];
  favorites: MenuItemDTO[];
}

const MAX_FAVORITES = 10;

function numericIndex(value: string | null): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function toMenuItemDTO(item: MenuItem): MenuItemDTO {
  return {
    title: item.title ?? '',
    icon: item.icon ?? '',
    url: item.url ?? '',
    id: item.id,
    parentId: item.parentId,
    code: item.code ?? '',
    auth: item.auth,
    index: numericIndex(item.index),
    level: item.level,
    sortId: item.sortId,
    toolMenu: item.toolMenu,
    permissionCode: item.permissionCode,
  };
}

function collectMenuIds(nodes: MenuItemDTO[], ids: Set<string>): void {
  for (const node of nodes) {
    ids.add(node.id);

    if (node.children) {
      collectMenuIds(node.children, ids);
    }
  }
}

async function findMenuItems(ids: string[]): Promise<Map<string, MenuItemDTO>> {
  const map = new Map<string, MenuItemDTO>();

  if (ids.length === 0) {
    return map;
  }

  const rows = await prisma.menuItem.findMany({ where: { id: { in: ids } } });

  for (const row of rows) {
    map.set(row.id, toMenuItemDTO(row));
  }

  return map;
}

export async function getMenu(accountId: string): Promise<MenuDTO> {
  const [rows, snapshot] = await Promise.all([prisma.menuItem.findMany(), getAccountPermissions(accountId)]);

  const items: MenuItemDTO[] = [];
  for (const row of rows) {
    items.push(toMenuItemDTO(row));
  }
  items.sort((a, b) => a.index - b.index);

  const tree = listToTree(items);
  const menuItems = filterMenuTree(tree, snapshot.set);
  if (menuItems.length > 0) {
    menuItems[menuItems.length - 1].last = true;
  }

  // Favorites may only point at menus the account can still reach.
  const visibleIds = new Set<string>();
  collectMenuIds(menuItems, visibleIds);

  const favoriteRows = await prisma.menuFavorite.findMany({
    where: { accountId, menuId: { in: [...visibleIds] } },
    orderBy: { sortIndex: 'asc' },
  });
  const itemMap = await findMenuItems(favoriteRows.map(row => row.menuId));

  const favorites: MenuItemDTO[] = [];
  for (const row of favoriteRows) {
    const item = itemMap.get(row.menuId);
    if (item) {
      favorites.push(item);
    }
  }

  return { menuItems, favorites };
}

export async function updateMenuFavorites(accountId: string, favorites: { id: string }[]): Promise<MenuItemDTO[]> {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const favorite of favorites) {
    if (!seen.has(favorite.id)) {
      seen.add(favorite.id);
      ids.push(favorite.id);
    }
  }

  if (ids.length > MAX_FAVORITES) {
    throw new AppError('MAX_FAVORITES', 400, '收藏数量不能超过 10 个');
  }

  const itemMap = await findMenuItems(ids);

  const result: MenuItemDTO[] = [];
  const rows: { accountId: string; menuId: string; sortIndex: number }[] = [];
  for (const id of ids) {
    const item = itemMap.get(id);
    if (item) {
      result.push(item);
      rows.push({ accountId, menuId: id, sortIndex: rows.length });
    }
  }

  await prisma.$transaction(async transaction => {
    await transaction.menuFavorite.deleteMany({ where: { accountId } });
    if (rows.length > 0) {
      await transaction.menuFavorite.createMany({ data: rows });
    }
  });

  return result;
}

export async function getMenuBadges(): Promise<MenuBadgeDTO[]> {
  const rows = await prisma.menuBadge.findMany({ orderBy: { menuId: 'asc' } });

  const list: MenuBadgeDTO[] = [];
  for (const row of rows) {
    list.push({
      menuId: row.menuId,
      actionType: row.actionType,
      noticeStyle: row.noticeStyle,
      noticeContent: row.noticeContent,
    });
  }

  return list;
}
