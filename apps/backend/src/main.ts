import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PinoLoggerService } from './common/observability/pino-logger.service';
import { MetricsService } from './common/observability/metrics.service';
import { startTracing } from './common/observability/tracing';

startTracing();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  const logger = app.get(PinoLoggerService);
  app.useLogger(logger);

  app.use(helmet());

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'metrics', method: RequestMethod.GET }],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const metricsService = app.get(MetricsService);
  app.use((req: any, res: any, next: () => void) => {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
      metricsService.observeHttpRequest(
        req.method,
        req.route?.path || req.path || req.url,
        res.statusCode,
        durationSeconds,
      );
    });

    next();
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Omnichannel Platform API')
    .setDescription('Multi-tenant omnichannel SaaS platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.BACKEND_PORT || 3001;
  await app.listen(port);
  logger.log(`Application running on port ${port}`, 'Bootstrap');
}

bootstrap();
