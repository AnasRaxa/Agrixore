import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

// scrypt is built into Node (no native add-on to install). Parameters are stored in the hash so they can be raised later.
const COST = { N: 65536, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;
const MAX_MEMORY = 256 * 1024 * 1024;

function derive(password: string, salt: Buffer, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, { ...opts, maxmem: MAX_MEMORY }, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string, cost: { N: number; r: number; p: number } = COST): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, cost);
  return ['scrypt', cost.N, cost.r, cost.p, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !n || !r || !p || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await derive(password, Buffer.from(salt, 'base64'), { N: Number(n), r: Number(r), p: Number(p) });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

let dummy: Promise<string> | undefined;
/** A throwaway hash so a login for an unknown email takes as long as one for a real account. */
export function dummyHash(): Promise<string> {
  dummy ??= hashPassword(randomBytes(12).toString('hex'));
  return dummy;
}
