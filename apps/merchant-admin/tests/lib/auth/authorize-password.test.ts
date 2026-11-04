import { afterAll, beforeEach, expect, test } from 'vitest';

import { authenticateMerchantPassword } from '@/lib/auth';
import { initDatabase, prisma } from '@/lib/db';
import { merchantLoginLimiter } from '@/lib/rate-limit';

afterAll(() => prisma.$disconnect());
beforeEach(async () => {
  await initDatabase();
  merchantLoginLimiter.clear();
});

test('authenticates owner and staff by username or phone', async () => {
  await expect(authenticateMerchantPassword('merchant@example.com', 'merchant123')).resolves.toMatchObject({
    login: 'merchant@example.com',
  });
  await expect(authenticateMerchantPassword('13412345678', 'merchant123')).resolves.toMatchObject({
    accountId: '1',
  });
  await expect(authenticateMerchantPassword('staff@example.com', 'staff123')).resolves.toMatchObject({
    login: 'staff@example.com',
  });
});

test('rejects wrong passwords, disabled accounts and after five failures', async () => {
  expect(await authenticateMerchantPassword('staff@example.com', 'wrong')).toBeNull();
  await prisma.merchantAccount.update({ where: { username: 'staff@example.com' }, data: { status: 'DISABLED' } });
  expect(await authenticateMerchantPassword('staff@example.com', 'staff123')).toBeNull();
  await prisma.merchantAccount.update({ where: { username: 'staff@example.com' }, data: { status: 'ACTIVE' } });

  await Array.fromAsync({ length: 5 }, () => authenticateMerchantPassword('staff@example.com', 'wrong'));
  expect(await authenticateMerchantPassword('staff@example.com', 'staff123')).toBeNull();
});

test('writes login logs for known accounts', async () => {
  const before = await prisma.merchantLoginLog.count();
  await authenticateMerchantPassword('merchant@example.com', 'wrong');
  await authenticateMerchantPassword('merchant@example.com', 'merchant123');
  expect(await prisma.merchantLoginLog.count()).toBe(before + 2);
});
