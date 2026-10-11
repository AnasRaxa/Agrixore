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
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.MONGODB_URI) {
      ctx.addIssue({ code: 'custom', path: ['MONGODB_URI'], message: 'is required in production' });
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
  };
}
