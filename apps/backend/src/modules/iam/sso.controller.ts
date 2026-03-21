import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth/public.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RbacGuard } from '../../common/auth/rbac.guard';
import { RequirePermission } from '../../common/auth/rbac.decorator';
import { CurrentTenant } from '../../common/auth/tenant.decorator';
import { SamlAuthGuard } from '../../common/auth/saml-auth.guard';
import { SsoService } from './sso.service';

@ApiTags('SSO')
@Controller('sso')
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  @Get('config')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('settings:read')
  @ApiOperation({ summary: 'Get SSO configuration for the current tenant' })
  async getConfig(@CurrentTenant() tenantId: string) {
    return this.ssoService.getSsoConfig(tenantId);
  }

  @Put('config')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Create or update SSO configuration for the current tenant' })
  async updateConfig(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      entityId?: string;
      ssoUrl?: string;
      certificate?: string;
      enabled?: boolean;
    },
  ) {
    return this.ssoService.configureSso(tenantId, body);
  }

  @Get('login')
  @Public()
  @UseGuards(SamlAuthGuard)
  @ApiOperation({ summary: 'Start SAML login flow for a tenant' })
  async login() {
    return { started: true };
  }

  @Post('callback')
  @Public()
  @UseGuards(SamlAuthGuard)
  @ApiOperation({ summary: 'Handle SAML callback and issue JWT credentials' })
  async callback(@Req() req: { user: unknown }) {
    return req.user;
  }
}
