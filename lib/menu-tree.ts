export interface TreeNode {
  id: string;
  parentId: string;
  children?: TreeNode[];
}

/**
 * Builds a tree from a flat list without mutating the caller's array or items.
 * Items whose parent is missing from the list become roots, preserving input order.
 */
export function listToTree<T extends TreeNode>(list: T[]): T[] {
  const result: T[] = [];
  const map = new Map<string, T>();

  const copies: T[] = [];
  for (const item of list) {
    const copy = { ...item };
    delete copy.children;
    copies.push(copy);
  }

  for (const copy of copies) {
    map.set(copy.id, copy);
  }

  for (const copy of copies) {
    const parent = map.get(copy.parentId);
    if (parent) {
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(copy);
    } else {
      result.push(copy);
    }
  }

  return result;
}
