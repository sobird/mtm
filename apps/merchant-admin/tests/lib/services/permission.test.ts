import { MERCHANT_PERMISSIONS } from '@mtm/contracts';
import { afterAll, expect, test } from 'vitest';

import { initDatabase, prisma } from '@/lib/db';
import { SEED_ACCOUNT_ID, SEED_STAFF_ACCOUNT_ID } from '@/lib/db/seed/ids';
import { getAccountPermissions } from '@/lib/services/permission';

afterAll(() => prisma.$disconnect());

test('owner gets every merchant permission', async () => {
  await initDatabase();
  const snapshot = await getAccountPermissions(SEED_ACCOUNT_ID);
  expect(snapshot.isOwner).toBe(true);
  expect(snapshot.codes.sort()).toEqual([...MERCHANT_PERMISSIONS].sort());
});

test('staff gets only its role permissions', async () => {
  await initDatabase();
  const snapshot = await getAccountPermissions(SEED_STAFF_ACCOUNT_ID);
  expect(snapshot.isOwner).toBe(false);
  expect(snapshot.codes.sort()).toEqual([
    'product:create',
    'product:submit',
    'product:update',
    'product:view',
    'shop:update',
  ]);
  expect(snapshot.set.has('account:manage')).toBe(false);
});
