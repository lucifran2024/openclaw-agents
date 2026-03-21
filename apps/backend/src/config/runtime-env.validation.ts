export const CORE_RUNTIME_ENV_KEYS = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'OPENAI_API_KEY',
  'BACKEND_URL',
  'FRONTEND_URL',
] as const;

const DATABASE_ENV_KEYS = [
  'DATABASE_HOST',
  'DATABASE_PORT',
  'DATABASE_NAME',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
] as const;

const REDIS_ENV_KEYS = ['REDIS_HOST', 'REDIS_PORT'] as const;

export const CONDITIONAL_RUNTIME_ENV_GROUPS = [
  {
    feature: 'Stripe checkout, portal e webhook',
    keys: [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_PRICE_STARTER',
      'STRIPE_PRICE_PROFESSIONAL',
      'STRIPE_PRICE_ENTERPRISE',
    ],
  },
  {
    feature: 'WhatsApp webhook verification',
    keys: ['WHATSAPP_APP_SECRET', 'WHATSAPP_VERIFY_TOKEN'],
  },
  {
    feature: 'S3 / MinIO storage',
    keys: ['S3_ENDPOINT', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_BUCKET', 'S3_REGION'],
  },
  {
    feature: 'Tracing OTLP',
    keys: ['OTEL_EXPORTER_OTLP_ENDPOINT', 'OTEL_SERVICE_NAME'],
  },
] as const;

function isMissing(value: unknown) {
  return typeof value !== 'string' || value.trim().length === 0;
}

export function validateRuntimeEnv(config: Record<string, unknown>) {
  const missingCore = CORE_RUNTIME_ENV_KEYS.filter((key) => isMissing(config[key]));
  const hasDatabaseUrl = !isMissing(config.DATABASE_URL);
  const hasRedisUrl = !isMissing(config.REDIS_URL);
  const missingDatabase = hasDatabaseUrl
    ? []
    : DATABASE_ENV_KEYS.filter((key) => isMissing(config[key]));
  const missingRedis = hasRedisUrl ? [] : REDIS_ENV_KEYS.filter((key) => isMissing(config[key]));

  const missing = [...missingCore, ...missingDatabase, ...missingRedis];

  if (missing.length) {
    throw new Error(
      `Missing required runtime environment variables: ${missing.join(', ')}. ` +
        'See .env.example and PHASE_3_CLOSURE.md for the Phase 3 runtime contract.',
    );
  }

  return config;
}
