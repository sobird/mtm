import { AppError } from '@/lib/errors';
import type { MenuItemDTO } from '@/lib/services/menu';

/**
 * Adds or removes a menu item from the favorites list.
 *
 * Removing an existing item is always allowed; adding a new item when the list
 * is already at `max` throws `MAX_FAVORITES`.
 */
export function toggleFavorite(favorites: MenuItemDTO[], item: MenuItemDTO, max = 10): MenuItemDTO[] {
  if (favorites.some(favorite => favorite.id === item.id)) {
    return favorites.filter(favorite => favorite.id !== item.id);
  }

  if (favorites.length >= max) {
    throw new AppError('MAX_FAVORITES', 400, '收藏数量不能超过 10 个');
  }

  return [...favorites, item];
}
