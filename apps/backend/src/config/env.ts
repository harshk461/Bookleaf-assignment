import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DB_PROVIDER: z.enum(['pg', 'drizzle']).default('pg'),
  DB_POOL_SIZE: z.coerce.number().int().positive().default(10),
  PORT: z.coerce.number().default(4000),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default('7d'),
  AI_SERVICE_URL: z.string().min(1).default('http://localhost:8000'),
  AI_SERVICE_PORT: z.coerce.number().int().positive().default(8000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  REDIS_URL: z.string().optional(),
  ACK_QUEUE_NAME: z.string().default('ticket-acknowledgement'),
  ACK_QUEUE_ATTEMPTS: z.coerce.number().int().positive().default(5),
  ACK_QUEUE_BACKOFF_MS: z.coerce.number().int().positive().default(2000),
  ACK_QUEUE_CONCURRENCY: z.coerce.number().int().positive().default(2),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
    throw new Error('Environment validation failed');
  }
  return parsed.data;
}
