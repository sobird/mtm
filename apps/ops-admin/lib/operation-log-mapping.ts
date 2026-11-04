export interface AuditLogEntry {
  action: string;
  resource: 'audit';
  resourceId: string | null;
  detail: Record<string, unknown>;
}

/**
 * Maps a successful `audits` core-api call to an ops operation-log entry.
 *
 * Returns `null` for read-only requests and any path the BFF does not log.
 * Only call this after core-api has answered successfully, so failed business
 * actions are never recorded as completed. The detail is intentionally minimal:
 * core-api already records the full audit detail in its own core log.
 */
export function resolveAuditLogEntry(method: string, segments: string[], _data: unknown): AuditLogEntry | null {
  if (method.toUpperCase() !== 'POST' || segments.length !== 3 || segments[0] !== 'audits') {
    return null;
  }

  const action = segments[2];

  if (action !== 'approve' && action !== 'reject') {
    return null;
  }

  return { action: `audit.${action}`, resource: 'audit', resourceId: segments[1], detail: {} };
}
