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
