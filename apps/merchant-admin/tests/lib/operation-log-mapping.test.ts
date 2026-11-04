import { expect, test } from 'vitest';

import { resolveProductLogEntry } from '@/lib/operation-log-mapping';

test('maps product actions', () => {
  expect(resolveProductLogEntry('POST', ['products'], { id: 'p1', currentVersionId: 'v1' })).toEqual({
    action: 'product.create',
    resource: 'product',
    resourceId: 'p1',
    detail: { versionId: 'v1' },
  });
  expect(resolveProductLogEntry('POST', ['products', 'p1', 'submit'], { id: 'p1' })?.action).toBe('product.submit');
  expect(resolveProductLogEntry('POST', ['products', 'p1', 'publish'], { id: 'p1' })?.action).toBe('product.publish');
  expect(resolveProductLogEntry('POST', ['products', 'p1', 'offline'], { id: 'p1' })?.action).toBe('product.offline');
  expect(resolveProductLogEntry('DELETE', ['products', 'p1'], undefined)).toEqual({
    action: 'product.delete',
    resource: 'product',
    resourceId: 'p1',
    detail: {},
  });
  expect(resolveProductLogEntry('GET', ['products'], undefined)).toBeNull();
});
