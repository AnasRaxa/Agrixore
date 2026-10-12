import { SignJWT, jwtVerify } from 'jose';
import type { AdminProfile } from '@agrixore/shared';

const ISSUER = 'agrixore-api';
const AUDIENCE = 'agrixore-admin';

export interface Sessions {
  issue(admin: AdminProfile): Promise<string>;
  /** Returns the admin id for a valid, unexpired token, otherwise null. */
  verify(token: string): Promise<string | null>;
}

export function createSessions(secret: string, hours: number): Sessions {
  const key = new TextEncoder().encode(secret);
  return {
    issue: (admin) =>
      new SignJWT({ role: admin.role })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(admin.id)
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(`${hours}h`)
        .sign(key),
    async verify(token) {
      try {
        const { payload } = await jwtVerify(token, key, { issuer: ISSUER, audience: AUDIENCE, algorithms: ['HS256'] });
        return typeof payload.sub === 'string' ? payload.sub : null;
      } catch {
        return null;
      }
    },
  };
}
