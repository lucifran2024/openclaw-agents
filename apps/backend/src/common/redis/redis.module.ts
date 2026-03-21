import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './inject-redis.decorator';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('redis.url');
        const baseOptions = {
          maxRetriesPerRequest: null as null,
          ...(config.get('redis.tls') ? { tls: { rejectUnauthorized: false } } : {}),
        };

        if (redisUrl) {
          return new Redis(redisUrl, baseOptions);
        }

        return new Redis({
          host: config.get<string>('redis.host') || 'localhost',
          port: config.get<number>('redis.port') || 6379,
          ...baseOptions,
        });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
