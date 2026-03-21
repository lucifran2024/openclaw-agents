import { Module, Global } from '@nestjs/common';
import { PinoLoggerService } from './pino-logger.service';
import { HealthController } from './health.controller';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { CircuitBreakerService } from './circuit-breaker.service';

@Global()
@Module({
  controllers: [HealthController, MetricsController],
  providers: [PinoLoggerService, MetricsService, CircuitBreakerService],
  exports: [PinoLoggerService, MetricsService, CircuitBreakerService],
})
export class ObservabilityModule {}
