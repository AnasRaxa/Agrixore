import type { AdminUser, AdminUserRepo } from './userRepo';

/** Used without a database (local development and tests). */
export class InMemoryAdminUserRepo implements AdminUserRepo {
  private readonly users = new Map<string, AdminUser>();
  private seq = 0;

  async findByEmail(email: string) {
    return [...this.users.values()].find((u) => u.email === email) ?? null;
  }

  async findById(id: string) {
    return this.users.get(id) ?? null;
  }

  async create({ email, passwordHash }: { email: string; passwordHash: string }) {
    if ([...this.users.values()].some((u) => u.email === email)) throw new Error('Admin already exists');
    const user: AdminUser = { id: (++this.seq).toString(16).padStart(24, 'a'), email, passwordHash, role: 'admin' };
    this.users.set(user.id, user);
    return user;
  }

  async setPassword(email: string, passwordHash: string) {
    const user = [...this.users.values()].find((u) => u.email === email);
    if (!user) return false;
    user.passwordHash = passwordHash;
    return true;
  }

  async touchLogin() {}
}
