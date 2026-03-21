import { NestFactory } from '@nestjs/core';
import { PinoLoggerService } from './common/observability/pino-logger.service';
import { startTracing } from './common/observability/tracing';

startTracing();

async function bootstrapWorker() {
  process.env.APP_RUNTIME = 'worker';

  const { AppModule } = await import('./app.module');
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(PinoLoggerService);
  app.useLogger(logger);

  const shutdown = async (signal: string) => {
    logger.log(`Worker shutdown requested via ${signal}`, 'WorkerBootstrap');
    await app.close();
    process.exit(0);
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));

  logger.log('Worker runtime initialized and listening for BullMQ jobs', 'WorkerBootstrap');
}

bootstrapWorker();
