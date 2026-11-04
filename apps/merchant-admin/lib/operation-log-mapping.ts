export interface ProductLogEntry {
  action: string;
  resource: 'product';
  resourceId: string | null;
  detail: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const PRODUCT_SUB_ACTIONS = new Set(['submit', 'publish', 'offline']);

/**
 * Maps a successful `products` core-api call to a merchant operation-log entry.
 *
 * Returns `null` for read-only requests and any path the BFF does not log.
 * Only call this after core-api has answered successfully, so failed business
 * actions are never recorded as completed.
 */
export function resolveProductLogEntry(method: string, segments: string[], data: unknown): ProductLogEntry | null {
  const verb = method.toUpperCase();

  if (segments[0] !== 'products') {
    return null;
  }

  if (verb === 'POST' && segments.length === 1) {
    const record = isRecord(data) ? data : {};
    const detail: Record<string, unknown> = {};

    if (typeof record.currentVersionId === 'string') {
      detail.versionId = record.currentVersionId;
    }

    return {
      action: 'product.create',
      resource: 'product',
      resourceId: typeof record.id === 'string' ? record.id : null,
      detail,
    };
  }

  if ((verb === 'PUT' || verb === 'PATCH') && segments.length === 2) {
    return { action: 'product.update', resource: 'product', resourceId: segments[1], detail: {} };
  }

  if (verb === 'POST' && segments.length === 3 && PRODUCT_SUB_ACTIONS.has(segments[2])) {
    return { action: `product.${segments[2]}`, resource: 'product', resourceId: segments[1], detail: {} };
  }

  if (verb === 'DELETE' && segments.length === 2) {
    return { action: 'product.delete', resource: 'product', resourceId: segments[1], detail: {} };
  }

  return null;
}
