function escapeRegex(value: string) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function toPattern(origin: string) {
  return new RegExp(`^${escapeRegex(origin).replace(/\\\*/g, '.*')}$`);
}

export function getAllowedCorsOrigins() {
  const configured = process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || '';

  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isAllowedCorsOrigin(origin: string) {
  return getAllowedCorsOrigins().some((allowedOrigin) => toPattern(allowedOrigin).test(origin));
}
