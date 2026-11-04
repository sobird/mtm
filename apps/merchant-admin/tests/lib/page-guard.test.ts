import { PERMISSIONS } from '@mtm/contracts';
import { afterAll, expect, test, vi } from 'vitest';

import { initDatabase, prisma } from '@/lib/db';
import { SEED_STAFF_ACCOUNT_ID } from '@/lib/db/seed/ids';
import { requireMerchantPermission } from '@/lib/page-guard';

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

vi.mock('@/lib/auth', () => ({ auth: authMock }));

function signInAsStaff(): void {
  authMock.mockResolvedValue({ user: { accountId: SEED_STAFF_ACCOUNT_ID } });
}

afterAll(() => prisma.$disconnect());

test('redirects to /login when there is no session', async () => {
  await initDatabase();
  authMock.mockResolvedValue(null);

  await expect(requireMerchantPermission(PERMISSIONS.PRODUCT_VIEW)).rejects.toThrow('redirect:/login');
});

test('redirects to /403 when the staff account lacks the permission', async () => {
  await initDatabase();
  signInAsStaff();

  await expect(requireMerchantPermission(PERMISSIONS.ACCOUNT_MANAGE)).rejects.toThrow('redirect:/403');
});

test('returns the snapshot when the account has the permission', async () => {
  await initDatabase();
  signInAsStaff();

  const snapshot = await requireMerchantPermission(PERMISSIONS.PRODUCT_VIEW);
  expect(snapshot.set.has(PERMISSIONS.PRODUCT_VIEW)).toBe(true);
  expect(snapshot.isOwner).toBe(false);
});
