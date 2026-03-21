import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('redis.url');
        const tls = config.get('redis.tls')
          ? {
              tls: {
                rejectUnauthorized: false,
              },
            }
          : {};

        return {
          connection: redisUrl
            ? { url: redisUrl, ...tls }
            : {
                host: config.get('redis.host'),
                port: config.get('redis.port'),
                ...tls,
              },
          defaultJobOptions: {
            removeOnComplete: 1000,
            removeOnFail: 5000,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
