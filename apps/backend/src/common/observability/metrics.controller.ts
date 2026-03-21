import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { MetricsService } from './metrics.service';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Expose Prometheus metrics' })
  async getMetrics(@Res() response: Response) {
    response.setHeader('Content-Type', this.metricsService.getContentType());
    response.send(await this.metricsService.getMetrics());
  }
}
