import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RbacGuard } from '../../common/auth/rbac.guard';
import { RequirePermission } from '../../common/auth/rbac.decorator';
import { CurrentTenant, CurrentUser } from '../../common/auth/tenant.decorator';
import { DashboardService } from './dashboard.service';
import { KpiQueryDto } from './dto/kpi-query.dto';
import { SaveLayoutDto } from './dto/save-layout.dto';
import { PeriodType } from './entities/materialized-kpi.entity';
import { DateRangeQueryDto } from './dto/date-range-query.dto';
import { BoardQueryDto } from './dto/board-query.dto';
import { BoardRangeQueryDto } from './dto/board-range-query.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @RequirePermission('dashboard:read')
  @ApiOperation({ summary: 'Get current dashboard overview snapshot' })
  async getOverview(@CurrentTenant() tenantId: string) {
    return this.dashboardService.getOverview(tenantId);
  }

  @Get('kpis')
  @RequirePermission('dashboard:read')
  @ApiOperation({ summary: 'Get historical KPI data' })
  @ApiQuery({ name: 'metrics', required: true, description: 'Comma-separated metric names' })
  @ApiQuery({ name: 'periodType', required: true, enum: PeriodType })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiQuery({ name: 'agentId', required: false })
  @ApiQuery({ name: 'channel', required: false })
  async getKpis(
    @CurrentTenant() tenantId: string,
    @Query() query: KpiQueryDto,
  ) {
    const dimensions: Record<string, string> = {};
    if (query.teamId) dimensions.teamId = query.teamId;
    if (query.agentId) dimensions.agentId = query.agentId;
    if (query.channel) dimensions.channel = query.channel;

    return this.dashboardService.getKpis(tenantId, {
      metrics: query.metrics,
      periodType: query.periodType,
      startDate: query.startDate,
      endDate: query.endDate,
      dimensions: Object.keys(dimensions).length > 0 ? dimensions : undefined,
    });
  }

  @Get('cfd')
  @RequirePermission('dashboard:read')
  @ApiOperation({ summary: 'Get cumulative flow diagram data for a board' })
  @ApiQuery({ name: 'boardId', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getCfd(
    @CurrentTenant() tenantId: string,
    @Query() query: BoardRangeQueryDto,
  ) {
    return this.dashboardService.getCfdData(tenantId, query.boardId, query);
  }

  @Get('cycle-time')
  @RequirePermission('dashboard:read')
  @ApiOperation({ summary: 'Get cycle time histogram for a board' })
  @ApiQuery({ name: 'boardId', required: true })
  async getCycleTime(
    @CurrentTenant() tenantId: string,
    @Query() query: BoardQueryDto,
  ) {
    return this.dashboardService.getCycleTimeDistribution(tenantId, query.boardId);
  }

  @Get('agents')
  @RequirePermission('dashboard:read')
  @ApiOperation({ summary: 'Get agent performance ranking' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getAgents(
    @CurrentTenant() tenantId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.dashboardService.getAgentPerformance(tenantId, query);
  }

  @Get('channels')
  @RequirePermission('dashboard:read')
  @ApiOperation({ summary: 'Get channel breakdown for conversations and messages' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getChannels(
    @CurrentTenant() tenantId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.dashboardService.getChannelBreakdown(tenantId, query);
  }

  @Get('nps')
  @RequirePermission('dashboard:read')
  @ApiOperation({ summary: 'Get NPS snapshot and trend for the selected period' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getNps(
    @CurrentTenant() tenantId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.dashboardService.getNpsData(tenantId, query);
  }

  @Get('layout')
  @RequirePermission('dashboard:read')
  @ApiOperation({ summary: "Get user's widget layout" })
  async getLayout(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.dashboardService.getWidgetLayout(tenantId, user.sub);
  }

  @Put('layout')
  @RequirePermission('dashboard:write')
  @ApiOperation({ summary: 'Save widget layout' })
  async saveLayout(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: SaveLayoutDto,
  ) {
    return this.dashboardService.saveWidgetLayout(
      tenantId,
      user.sub,
      dto.widgets,
      dto.layoutName,
    );
  }
}
