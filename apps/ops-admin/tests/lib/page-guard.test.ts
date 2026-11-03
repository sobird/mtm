import { PERMISSIONS } from '@mtm/contracts';
import { afterAll, beforeEach, expect, test, vi } from 'vitest';

import { initDatabase } from '@/lib/db';
import { prisma } from '@/lib/db/client';
import { OPS_SEED_ADMIN_ID } from '@/lib/db/seed/ids';
import { requireOpsPermission } from '@/lib/page-guard';

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

vi.mock('@/lib/auth', () => ({ auth: authMock }));

beforeEach(async () => {
  await initDatabase();
  authMock.mockReset();
});

afterAll(async () => {
  await prisma.opsAccount.deleteMany({ where: { username: 'guard-limited' } });
  await prisma.$disconnect();
});

test('redirects to /login when there is no session', async () => {
  authMock.mockResolvedValue(null);
  await expect(requireOpsPermission(PERMISSIONS.PRODUCT_VIEW)).rejects.toThrow('redirect:/login');
});

test('redirects to /403 when the account lacks the permission', async () => {
  const account = await prisma.opsAccount.create({
    data: { username: 'guard-limited', passwordHash: 'x', name: '守卫受限' },
  });
  authMock.mockResolvedValue({ user: { accountId: account.id, username: 'guard-limited', name: '守卫受限' } });

  await expect(requireOpsPermission(PERMISSIONS.PRODUCT_VIEW)).rejects.toThrow('redirect:/403');
});

test('returns the snapshot when the account has the permission', async () => {
  authMock.mockResolvedValue({
    user: { accountId: OPS_SEED_ADMIN_ID, username: 'admin', name: '超级管理员' },
  });

  const snapshot = await requireOpsPermission(PERMISSIONS.PRODUCT_VIEW);
  expect(snapshot.set.has(PERMISSIONS.PRODUCT_VIEW)).toBe(true);
});
