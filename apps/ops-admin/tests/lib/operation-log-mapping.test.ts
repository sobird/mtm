import { expect, test } from 'vitest';

import { resolveAuditLogEntry } from '@/lib/operation-log-mapping';

test('maps audit actions', () => {
  expect(resolveAuditLogEntry('POST', ['audits', 'a1', 'approve'], { id: 'a1' })).toEqual({
    action: 'audit.approve',
    resource: 'audit',
    resourceId: 'a1',
    detail: {},
  });
  expect(resolveAuditLogEntry('POST', ['audits', 'a1', 'reject'], { id: 'a1' })?.action).toBe('audit.reject');
  expect(resolveAuditLogEntry('GET', ['audits'], undefined)).toBeNull();
});
