import { AppError } from '@/lib/errors';
import type { MenuItemDTO } from '@/lib/services/menu';

export const MAX_FAVORITES = 10;

/**
 * Adds or removes a menu item from the favorites list.
 *
 * Removing an existing item is always allowed; adding a new item when the list
 * is already at `max` throws `MAX_FAVORITES`.
 */
export function toggleFavorite(favorites: MenuItemDTO[], item: MenuItemDTO, max = MAX_FAVORITES): MenuItemDTO[] {
  if (favorites.some(favorite => favorite.id === item.id)) {
    return favorites.filter(favorite => favorite.id !== item.id);
  }

  // Count unique ids so malformed input cannot trip the cap early.
  if (new Set(favorites.map(favorite => favorite.id)).size >= max) {
    throw new AppError('MAX_FAVORITES', 400, '收藏数量不能超过 10 个');
  }

  return [...favorites, item];
}
