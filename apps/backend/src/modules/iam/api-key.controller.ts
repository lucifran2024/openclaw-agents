import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RbacGuard } from '../../common/auth/rbac.guard';
import { RequirePermission } from '../../common/auth/rbac.decorator';
import { CurrentTenant, CurrentUser } from '../../common/auth/tenant.decorator';
import { ApiKeyService } from './api-key.service';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Create a new API key for the current tenant' })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub?: string; userId?: string },
    @Body() body: { name: string; permissions: string[]; expiresAt?: string },
  ) {
    return this.apiKeyService.createApiKey(
      tenantId,
      body.name,
      body.permissions || [],
      user.sub || user.userId,
      body.expiresAt ? new Date(body.expiresAt) : undefined,
    );
  }

  @Get()
  @RequirePermission('settings:read')
  @ApiOperation({ summary: 'List API keys for the current tenant' })
  async list(@CurrentTenant() tenantId: string) {
    return this.apiKeyService.listApiKeys(tenantId);
  }

  @Delete(':id')
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Revoke an API key' })
  async revoke(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.apiKeyService.revokeApiKey(tenantId, id);
  }
}
