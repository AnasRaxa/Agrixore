import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';
import { createSessions } from './session';

const FAST = { N: 1024, r: 8, p: 1 };

describe('passwords', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('a long passphrase', FAST);
    expect(await verifyPassword('a long passphrase', hash)).toBe(true);
    expect(await verifyPassword('a long passphrasE', hash)).toBe(false);
  });
  it('salts every hash differently and never stores the password', async () => {
    const [a, b] = await Promise.all([hashPassword('same', FAST), hashPassword('same', FAST)]);
    expect(a).not.toBe(b);
    expect(a).not.toContain('same');
  });
  it('rejects malformed stored hashes instead of throwing', async () => {
    for (const bad of ['', 'plain', 'bcrypt$1$2$3$4$5', 'scrypt$1024$8$1$']) expect(await verifyPassword('x', bad)).toBe(false);
  });
});

describe('sessions', () => {
  const admin = { id: 'abc', email: 'a@b.co', role: 'admin' as const };
  it('round-trips a valid token', async () => {
    const s = createSessions('s'.repeat(40), 1);
    expect(await s.verify(await s.issue(admin))).toBe('abc');
  });
  it('rejects a token signed with another secret, a tampered token and garbage', async () => {
    const token = await createSessions('s'.repeat(40), 1).issue(admin);
    const other = createSessions('t'.repeat(40), 1);
    expect(await other.verify(token)).toBeNull();
    expect(await createSessions('s'.repeat(40), 1).verify(`${token.slice(0, -3)}abc`)).toBeNull();
    expect(await other.verify('not-a-token')).toBeNull();
  });
});
