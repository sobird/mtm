import { expect, test } from 'vitest';

import { hashPassword, verifyPassword } from '../src/password';

test('hashes with argon2id and verifies', async () => {
  const hash = await hashPassword('merchant123');
  expect(hash.startsWith('$argon2id$')).toBe(true);
  await expect(verifyPassword(hash, 'merchant123')).resolves.toBe(true);
  await expect(verifyPassword(hash, 'wrong')).resolves.toBe(false);
});

test('each hash uses a distinct salt', async () => {
  const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')]);
  expect(a).not.toBe(b);
});

test('malformed hashes verify false instead of throwing', async () => {
  await expect(verifyPassword('not-a-hash', 'x')).resolves.toBe(false);
});
