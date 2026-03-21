import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RbacGuard } from '../../common/auth/rbac.guard';
import { RequirePermission } from '../../common/auth/rbac.decorator';
import { CurrentTenant, CurrentUser } from '../../common/auth/tenant.decorator';
import { ReportService, CreateReportDto } from './report.service';
import { ExportService, CreateExportDto } from './export.service';
import { ReportType } from './entities/saved-report.entity';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportService: ReportService,
    private readonly exportService: ExportService,
  ) {}

  @Get()
  @RequirePermission('reports:read')
  @ApiOperation({ summary: 'List saved reports' })
  @ApiQuery({ name: 'type', required: false, enum: ReportType })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('type') type?: ReportType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportService.getReports(tenantId, {
      type,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  @RequirePermission('reports:write')
  @ApiOperation({ summary: 'Create a saved report' })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateReportDto,
  ) {
    return this.reportService.createReport(tenantId, user.sub, dto);
  }

  @Get('export/:id')
  @RequirePermission('reports:read')
  @ApiOperation({ summary: 'Get export job status / download link' })
  async getExportStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.exportService.getExportStatus(tenantId, id);
  }

  @Post('export')
  @RequirePermission('reports:write')
  @ApiOperation({ summary: 'Create an export job' })
  async createExport(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateExportDto,
  ) {
    return this.exportService.createExportJob(tenantId, user.sub, dto);
  }

  @Get(':id')
  @RequirePermission('reports:read')
  @ApiOperation({ summary: 'Get report detail' })
  async findById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.reportService.getReportById(tenantId, id);
  }

  @Delete(':id')
  @RequirePermission('reports:write')
  @ApiOperation({ summary: 'Delete a saved report' })
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.reportService.deleteReport(tenantId, id);
    return { deleted: true };
  }

  @Post(':id/generate')
  @RequirePermission('reports:write')
  @ApiOperation({ summary: 'Generate fresh report data' })
  async generate(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.reportService.generateReport(tenantId, id);
  }
}
