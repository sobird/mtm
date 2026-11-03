import { filterMenuTree } from '@mtm/auth/menu-filter';

import { prisma } from '@/lib/db/client';
import type { OpsMenuItem } from '@/lib/generated/prisma';
import { listToTree } from '@/lib/menu-tree';

import { getAccountPermissions } from './permission';

export interface MenuNodeDTO {
  id: string;
  title: string;
  icon: string;
  url: string;
  parentId: string;
  level: number;
  index: number;
  sortId: number;
  permissionCode: string | null;
  children?: MenuNodeDTO[];
  last?: boolean;
}

export interface MenuDTO {
  menuItems: MenuNodeDTO[];
}

function numericIndex(value: string | null): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function toMenuNode(item: OpsMenuItem): MenuNodeDTO {
  return {
    id: item.id,
    title: item.title,
    icon: item.icon ?? '',
    url: item.url ?? '',
    parentId: item.parentId,
    level: item.level,
    index: numericIndex(item.index),
    sortId: item.sortId,
    permissionCode: item.permissionCode,
  };
}

/** Returns the menu tree visible to an account, with the last root flagged. */
export async function getMenu(accountId: string): Promise<MenuDTO> {
  const rows = await prisma.opsMenuItem.findMany();
  const items = rows.map(item => toMenuNode(item));
  items.sort((a, b) => a.index - b.index);

  const tree = listToTree(items);
  const snapshot = await getAccountPermissions(accountId);
  const menuItems = filterMenuTree(tree, snapshot.set);

  if (menuItems.length > 0) {
    menuItems[menuItems.length - 1].last = true;
  }

  return { menuItems };
}
