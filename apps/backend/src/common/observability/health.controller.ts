import { Controller, Get } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly orm: MikroORM) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  async check() {
    const dbOk = await this.orm.isConnected();
    return {
      status: dbOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbOk ? 'connected' : 'disconnected',
      },
    };
  }
}
