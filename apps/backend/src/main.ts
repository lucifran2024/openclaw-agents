import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { PinoLoggerService } from './common/observability/pino-logger.service';
import { MetricsService } from './common/observability/metrics.service';
import { startTracing } from './common/observability/tracing';
import { getAllowedCorsOrigins, isAllowedCorsOrigin } from './common/http/cors.util';

startTracing();

async function bootstrap() {
  process.env.APP_RUNTIME ??= 'api';
  const { AppModule } = await import('./app.module');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  const logger = app.get(PinoLoggerService);
  app.useLogger(logger);

  app.use(helmet());

  const allowedOrigins = getAllowedCorsOrigins();
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || isAllowedCorsOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(
        new Error(
          `Origin ${origin} is not allowed by CORS. Configure FRONTEND_URL or CORS_ALLOWED_ORIGINS.`,
        ),
        false,
      );
    },
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

  const port = process.env.PORT || process.env.BACKEND_PORT || 3001;
  await app.listen(port);
  logger.log(
    `Application running on port ${port} with CORS origins: ${allowedOrigins.join(', ') || 'none'}`,
    'Bootstrap',
  );
}

bootstrap();
