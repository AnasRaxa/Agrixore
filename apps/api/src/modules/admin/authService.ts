import type { AdminProfile } from '@agrixore/shared';
import { dummyHash, verifyPassword } from '../../lib/password';
import type { Sessions } from '../../lib/session';
import type { AdminUser, AdminUserRepo } from './userRepo';

const toProfile = (u: AdminUser): AdminProfile => ({ id: u.id, email: u.email, role: u.role });

export class AuthService {
  constructor(
    private readonly users: AdminUserRepo,
    private readonly sessions: Sessions,
  ) {}

  /** Returns null for any wrong email or password (the caller must not say which). */
  async login(email: string, password: string): Promise<{ admin: AdminProfile; token: string } | null> {
    const user = await this.users.findByEmail(email.trim().toLowerCase());
    // Always verify against some hash, so unknown emails cost the same time as wrong passwords.
    const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash()));
    if (!user || !ok) return null;
    await this.users.touchLogin(user.id);
    const admin = toProfile(user);
    return { admin, token: await this.sessions.issue(admin) };
  }

  /** Resolves a session token to an admin who still exists, otherwise null. Deleting an account ends its sessions. */
  async authenticate(token: string | undefined): Promise<AdminProfile | null> {
    if (!token) return null;
    const id = await this.sessions.verify(token);
    if (!id) return null;
    const user = await this.users.findById(id);
    return user ? toProfile(user) : null;
  }
}
