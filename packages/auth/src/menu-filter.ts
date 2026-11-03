export interface PermissionMenuNode {
  id: string;
  parentId: string;
  url?: string | null;
  permissionCode?: string | null;
  children?: PermissionMenuNode[];
}

export function canAccessMenu(node: PermissionMenuNode, permissions: ReadonlySet<string>): boolean {
  return !node.permissionCode || permissions.has(node.permissionCode);
}

export function filterMenuTree<T extends PermissionMenuNode>(nodes: T[], permissions: ReadonlySet<string>): T[] {
  const result: T[] = [];

  for (const node of nodes) {
    if (!canAccessMenu(node, permissions)) continue;

    if (!node.children) {
      result.push({ ...node });
      continue;
    }

    const children = filterMenuTree(node.children, permissions);
    if (children.length === 0) continue;

    result.push({ ...node, children });
  }

  return result;
}
