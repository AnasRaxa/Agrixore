import { z } from 'zod';

const booleanString = z.enum(['true', 'false']).transform((v) => v === 'true');

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:4173'),
    MONGODB_URI: z.string().min(1).optional(),
    MANDI_SEED_SAMPLE: booleanString.optional(),
    RATE_LIMIT_PER_MIN: z.coerce.number().int().min(1).default(120),
    /** Turns the admin dashboard on. At least 32 random characters. */
    JWT_SECRET: z.string().min(32, 'must be at least 32 characters').optional(),
    ADMIN_SESSION_HOURS: z.coerce.number().int().min(1).max(168).default(12),
    /** Folder with the built admin dashboard. Default: apps/admin/dist. */
    ADMIN_STATIC_DIR: z.string().optional(),
    /** Default: true in production. Set false only to try production mode over plain http. */
    COOKIE_SECURE: booleanString.optional(),
    /** Development only: an admin account for the in-memory (no database) mode. */
    ADMIN_DEV_EMAIL: z.string().email().optional(),
    ADMIN_DEV_PASSWORD: z.string().min(12, 'must be at least 12 characters').optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.MONGODB_URI) {
      ctx.addIssue({ code: 'custom', path: ['MONGODB_URI'], message: 'is required in production' });
    }
    if (!!env.ADMIN_DEV_EMAIL !== !!env.ADMIN_DEV_PASSWORD) {
      ctx.addIssue({ code: 'custom', path: ['ADMIN_DEV_EMAIL'], message: 'set ADMIN_DEV_EMAIL and ADMIN_DEV_PASSWORD together' });
    }
    if (env.NODE_ENV === 'production' && env.ADMIN_DEV_EMAIL) {
      ctx.addIssue({ code: 'custom', path: ['ADMIN_DEV_EMAIL'], message: 'the development admin is not allowed in production' });
    }
    if (env.ADMIN_DEV_EMAIL && env.MONGODB_URI) {
      ctx.addIssue({ code: 'custom', path: ['ADMIN_DEV_EMAIL'], message: 'only applies without MONGODB_URI; with a database, create admins with admin:create' });
    }
    if (env.NODE_ENV === 'production' && env.MANDI_SEED_SAMPLE) {
      ctx.addIssue({ code: 'custom', path: ['MANDI_SEED_SAMPLE'], message: 'sample data is not allowed in production' });
    }
  });

export interface Config {
  env: 'development' | 'test' | 'production';
  port: number;
  logLevel: string;
  corsOrigins: string[];
  mongoUri: string | undefined;
  /** Load made-up preview prices into the in-memory store. Never true in production. */
  seedSampleMandi: boolean;
  rateLimitPerMin: number;
  /** Admin dashboard is enabled only when this is set. */
  jwtSecret: string | undefined;
  adminSessionHours: number;
  adminStaticDir: string | undefined;
  cookieSecure: boolean;
  devAdmin: { email: string; password: string } | undefined;
}

/** Validates the environment once at startup and fails fast with a readable message. */
export function loadConfig(source: Record<string, string | undefined> = process.env): Config {
  // An empty value in a .env file (KEY=) means "not set".
  const cleaned = Object.fromEntries(Object.entries(source).filter(([, v]) => v !== undefined && v !== ''));
  const parsed = schema.safeParse(cleaned);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `- ${i.path.join('.') || 'env'}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
  }
  const e = parsed.data;
  return {
    env: e.NODE_ENV,
    port: e.PORT,
    logLevel: e.LOG_LEVEL,
    corsOrigins: e.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
    mongoUri: e.MONGODB_URI,
    seedSampleMandi: e.MANDI_SEED_SAMPLE ?? e.NODE_ENV !== 'production',
    rateLimitPerMin: e.RATE_LIMIT_PER_MIN,
    jwtSecret: e.JWT_SECRET,
    adminSessionHours: e.ADMIN_SESSION_HOURS,
    adminStaticDir: e.ADMIN_STATIC_DIR,
    cookieSecure: e.COOKIE_SECURE ?? e.NODE_ENV === 'production',
    devAdmin: e.ADMIN_DEV_EMAIL && e.ADMIN_DEV_PASSWORD ? { email: e.ADMIN_DEV_EMAIL.toLowerCase(), password: e.ADMIN_DEV_PASSWORD } : undefined,
  };
}
