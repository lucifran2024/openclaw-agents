import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RbacGuard } from '../../common/auth/rbac.guard';
import { RequirePermission } from '../../common/auth/rbac.decorator';
import { CurrentTenant } from '../../common/auth/tenant.decorator';
import { TenantService } from './tenant.service';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current tenant' })
  async getCurrent(@CurrentTenant() tenantId: string) {
    return this.tenantService.findById(tenantId);
  }

  @Patch('current')
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Update current tenant settings' })
  async updateCurrent(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      name?: string;
      slug?: string;
      vertical?: string;
      settings?: Record<string, unknown>;
    },
  ) {
    return this.tenantService.update(tenantId, body);
  }
}
