import { Inject } from '@nestjs/common';

export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Local shim for @InjectRedis() decorator.
 * Injects the Redis client registered under the REDIS_CLIENT token.
 */
export function InjectRedis(): ParameterDecorator {
  return Inject(REDIS_CLIENT);
}
