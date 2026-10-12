import type { AdminRole } from '@agrixore/shared';

export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
}

/** Admin accounts. There is no public sign-up: accounts are created with `pnpm --filter @agrixore/api admin:create`. */
export interface AdminUserRepo {
  findByEmail(email: string): Promise<AdminUser | null>;
  findById(id: string): Promise<AdminUser | null>;
  /** Fails if the email already exists. */
  create(input: { email: string; passwordHash: string }): Promise<AdminUser>;
  setPassword(email: string, passwordHash: string): Promise<boolean>;
  touchLogin(id: string): Promise<void>;
}
