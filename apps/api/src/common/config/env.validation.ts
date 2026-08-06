import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  COOKIE_SECRET: z.string().min(1, 'COOKIE_SECRET is required').default('orvyn-pms-cookie-secret-dev'),

  // Redis configuration
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z.coerce.boolean().default(false),

  // Cloudinary configuration (Mandatory Cloudinary Storage)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Storage provider selection ('cloudinary' as primary)
  STORAGE_PROVIDER: z.string().default('cloudinary'),

  // BullMQ Worker & Puppeteer configuration
  WORKER_CONCURRENCY: z.coerce.number().default(1),
  PUPPETEER_WARMUP: z.coerce.boolean().default(false),
  PUPPETEER_EXECUTABLE_PATH: z.string().optional(),

  // Queue Rate Limiter configuration
  QUEUE_LIMITER_MAX: z.coerce.number().default(5),
  QUEUE_LIMITER_DURATION: z.coerce.number().default(10000),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    console.error('❌ Invalid environment variables configuration:', result.error.format());
    throw new Error(`Environment validation failed: ${JSON.stringify(result.error.format())}`);
  }
  return result.data;
}
