import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RbacGuard } from '../../common/auth/rbac.guard';
import { RequirePermission } from '../../common/auth/rbac.decorator';
import { CurrentTenant } from '../../common/auth/tenant.decorator';
import { SlaService } from './sla.service';

@ApiTags('SLA Policies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('sla-policies')
export class SlaController {
  constructor(private readonly slaService: SlaService) {}

  @Get()
  @RequirePermission('settings:read')
  @ApiOperation({ summary: 'List SLA policies' })
  async findAll(@CurrentTenant() tenantId: string) {
    return this.slaService.findPolicies(tenantId);
  }

  @Post()
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Create SLA policy' })
  async create(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      name: string;
      firstResponseMinutes: number;
      resolutionMinutes: number;
      priorityOverrides?: Record<string, { firstResponse: number; resolution: number }>;
      businessHours?: Record<string, unknown>;
    },
  ) {
    return this.slaService.createPolicy(tenantId, body);
  }

  @Patch(':id')
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Update SLA policy' })
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      firstResponseMinutes?: number;
      resolutionMinutes?: number;
      priorityOverrides?: Record<string, { firstResponse: number; resolution: number }>;
      businessHours?: Record<string, unknown>;
    },
  ) {
    const policy = await this.slaService.updatePolicy(tenantId, id, body);
    if (!policy) throw new NotFoundException('SLA policy not found');
    return policy;
  }

  @Delete(':id')
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Delete SLA policy' })
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const deleted = await this.slaService.deletePolicy(tenantId, id);
    if (!deleted) throw new NotFoundException('SLA policy not found');
    return { success: true };
  }
}
