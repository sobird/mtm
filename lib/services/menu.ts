import { sequelize } from '@/lib/db/connection';
import { MenuBadge, MenuFavorite, MenuItem } from '@/lib/db/models';
import { listToTree } from '@/lib/menu-tree';

import { AppError } from '../errors';

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
  };
}

async function findMenuItems(ids: string[]): Promise<Map<string, MenuItemDTO>> {
  const map = new Map<string, MenuItemDTO>();

  if (ids.length === 0) {
    return map;
  }

  const rows = await MenuItem.findAll({ where: { id: ids } });

  for (const row of rows) {
    map.set(row.id, toMenuItemDTO(row));
  }

  return map;
}

export async function getMenu(accountId: number): Promise<MenuDTO> {
  const rows = await MenuItem.findAll();

  const items: MenuItemDTO[] = [];
  for (const row of rows) {
    items.push(toMenuItemDTO(row));
  }
  items.sort((a, b) => a.index - b.index);

  const menuItems = listToTree(items);
  if (menuItems.length > 0) {
    menuItems[menuItems.length - 1].last = true;
  }

  const favoriteRows = await MenuFavorite.findAll({
    where: { accountId },
    order: [['sortIndex', 'ASC']],
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

export async function updateMenuFavorites(accountId: number, favorites: { id: string }[]): Promise<MenuItemDTO[]> {
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
  const rows: { accountId: number; menuId: string; sortIndex: number }[] = [];
  for (const id of ids) {
    const item = itemMap.get(id);
    if (item) {
      result.push(item);
      rows.push({ accountId, menuId: id, sortIndex: rows.length });
    }
  }

  await sequelize.transaction(async transaction => {
    await MenuFavorite.destroy({ where: { accountId }, transaction });
    if (rows.length > 0) {
      await MenuFavorite.bulkCreate(rows, { transaction });
    }
  });

  return result;
}

export async function getMenuBadges(): Promise<MenuBadgeDTO[]> {
  const rows = await MenuBadge.findAll({ order: [['menuId', 'ASC']] });

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
