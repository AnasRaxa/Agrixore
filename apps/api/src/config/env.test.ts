import { describe, expect, it } from 'vitest';
import { loadConfig } from './env';

describe('loadConfig', () => {
  it('uses safe defaults in development', () => {
    const c = loadConfig({});
    expect(c).toMatchObject({ env: 'development', port: 4000, seedSampleMandi: true, mongoUri: undefined });
    expect(c.corsOrigins).toContain('http://localhost:5173');
  });

  it('treats empty values as not set', () => {
    expect(loadConfig({ MONGODB_URI: '', MANDI_SEED_SAMPLE: '' }).mongoUri).toBeUndefined();
  });

  it('requires MONGODB_URI in production', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/MONGODB_URI/);
  });

  it('turns sample data off by default in production and forbids turning it on', () => {
    expect(loadConfig({ NODE_ENV: 'production', MONGODB_URI: 'mongodb://x' }).seedSampleMandi).toBe(false);
    expect(() => loadConfig({ NODE_ENV: 'production', MONGODB_URI: 'mongodb://x', MANDI_SEED_SAMPLE: 'true' })).toThrow(/sample/);
  });

  it('rejects invalid values with a readable message', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/Invalid environment configuration/);
  });

  it('splits CORS origins', () => {
    expect(loadConfig({ CORS_ORIGINS: 'https://a.example, https://b.example' }).corsOrigins).toEqual(['https://a.example', 'https://b.example']);
  });
});

describe('admin settings', () => {
  const secret = 'x'.repeat(32);
  it('leaves the admin dashboard off unless JWT_SECRET is set', () => {
    expect(loadConfig({}).jwtSecret).toBeUndefined();
    expect(loadConfig({ JWT_SECRET: secret }).jwtSecret).toBe(secret);
  });
  it('rejects a short JWT_SECRET', () => {
    expect(() => loadConfig({ JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });
  it('makes the sign-in cookie Secure in production unless overridden', () => {
    expect(loadConfig({ NODE_ENV: 'production', MONGODB_URI: 'mongodb://x' }).cookieSecure).toBe(true);
    expect(loadConfig({ NODE_ENV: 'production', MONGODB_URI: 'mongodb://x', COOKIE_SECURE: 'false' }).cookieSecure).toBe(false);
    expect(loadConfig({}).cookieSecure).toBe(false);
  });
  it('accepts a development admin only without a database and never in production', () => {
    const dev = { ADMIN_DEV_EMAIL: 'Dev@Example.com', ADMIN_DEV_PASSWORD: 'a long dev password' };
    expect(loadConfig({ JWT_SECRET: secret, ...dev }).devAdmin).toEqual({ email: 'dev@example.com', password: 'a long dev password' });
    expect(() => loadConfig({ ...dev, MONGODB_URI: 'mongodb://x' })).toThrow(/ADMIN_DEV_EMAIL/);
    expect(() => loadConfig({ ...dev, NODE_ENV: 'production', MONGODB_URI: 'mongodb://x' })).toThrow(/not allowed in production/);
    expect(() => loadConfig({ ADMIN_DEV_EMAIL: 'dev@example.com' })).toThrow(/together/);
    expect(() => loadConfig({ ADMIN_DEV_EMAIL: 'dev@example.com', ADMIN_DEV_PASSWORD: 'short' })).toThrow(/ADMIN_DEV_PASSWORD/);
  });
});
