/**
 * Creates the first admin account (there is deliberately no public sign-up) or resets a password.
 *
 *   pnpm --filter @agrixore/api admin:create                  # asks for email and password
 *   pnpm --filter @agrixore/api admin:create -- --reset-password
 *
 * Needs MONGODB_URI (from the environment or apps/api/.env). For scripts, ADMIN_EMAIL and ADMIN_PASSWORD can be set instead of being asked.
 */
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { z } from 'zod';
import { PASSWORD_MIN_LENGTH } from '@agrixore/shared';
import { connectMongo, disconnectMongo, ensureIndexes } from '../db/connect';
import { hashPassword } from '../lib/password';
import { MongoAdminUserRepo } from '../modules/admin/userRepo.mongo';

async function ask(question: string, hidden = false): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) process.stdout.write(chunk);
      cb();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  const pending = rl.question(question);
  muted = hidden;
  const answer = await pending;
  rl.close();
  if (hidden) process.stdout.write('\n');
  return answer.trim();
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set. Put it in apps/api/.env or the environment.');
  const reset = process.argv.includes('--reset-password');

  const email = z.email('That is not a valid email address.').parse((process.env.ADMIN_EMAIL ?? (await ask('Admin email: '))).toLowerCase());
  const password = process.env.ADMIN_PASSWORD ?? (await ask(`Password (at least ${PASSWORD_MIN_LENGTH} characters): `, true));
  if (password.length < PASSWORD_MIN_LENGTH) throw new Error(`The password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
  if (!process.env.ADMIN_PASSWORD && password !== (await ask('Repeat the password: ', true))) throw new Error('The passwords do not match.');

  await connectMongo(uri);
  const admins = new MongoAdminUserRepo();
  await ensureIndexes();
  const passwordHash = await hashPassword(password);

  if (reset) {
    if (!(await admins.setPassword(email, passwordHash))) throw new Error(`No admin with the email ${email} exists.`);
    console.log(`Password updated for ${email}.`);
  } else {
    if (await admins.findByEmail(email)) throw new Error(`An admin with the email ${email} already exists. Use --reset-password to change the password.`);
    await admins.create({ email, passwordHash });
    console.log(`Admin ${email} created. Sign in at /admin/.`);
  }
}

main()
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => void disconnectMongo());
