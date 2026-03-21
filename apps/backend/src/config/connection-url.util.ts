function parseInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: string | undefined) {
  return ['1', 'true', 'yes', 'on'].includes((value ?? '').trim().toLowerCase());
}

export function getDatabaseConnectionConfig(env = process.env) {
  const url = env.DATABASE_URL?.trim();
  const ssl = parseBoolean(env.DATABASE_SSL);

  if (!url) {
    return {
      url: undefined,
      host: env.DATABASE_HOST || 'localhost',
      port: parseInteger(env.DATABASE_PORT, 5432),
      name: env.DATABASE_NAME || 'omnichannel',
      user: env.DATABASE_USER || 'postgres',
      password: env.DATABASE_PASSWORD || 'postgres',
      ssl,
    };
  }

  const parsed = new URL(url);

  return {
    url,
    host: parsed.hostname,
    port: parseInteger(parsed.port, 5432),
    name: decodeURIComponent(parsed.pathname.replace(/^\//, '')) || env.DATABASE_NAME || 'omnichannel',
    user: decodeURIComponent(parsed.username) || env.DATABASE_USER || 'postgres',
    password: decodeURIComponent(parsed.password) || env.DATABASE_PASSWORD || 'postgres',
    ssl,
  };
}

export function getRedisConnectionConfig(env = process.env) {
  const url = env.REDIS_URL?.trim();
  const tls = parseBoolean(env.REDIS_TLS_ENABLED);

  if (!url) {
    return {
      url: undefined,
      host: env.REDIS_HOST || 'localhost',
      port: parseInteger(env.REDIS_PORT, 6379),
      tls,
    };
  }

  const parsed = new URL(url);

  return {
    url,
    host: parsed.hostname,
    port: parseInteger(parsed.port, 6379),
    tls,
  };
}
