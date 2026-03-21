import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RbacGuard } from '../../common/auth/rbac.guard';
import { RequirePermission } from '../../common/auth/rbac.decorator';
import { CurrentTenant } from '../../common/auth/tenant.decorator';
import { Public } from '../../common/auth/public.decorator';
import { OnboardingService } from './onboarding.service';
import { WhitelabelService } from './whitelabel.service';
import { OnboardingTheme, OnboardingVertical } from './onboarding-config.entity';

@ApiTags('Onboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('onboarding')
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly whitelabelService: WhitelabelService,
  ) {}

  @Get('status')
  @RequirePermission('settings:read')
  @ApiOperation({ summary: 'Get onboarding status for current tenant' })
  async getStatus(@CurrentTenant() tenantId: string) {
    return this.onboardingService.getOnboardingStatus(tenantId);
  }

  @Post('step/:stepName/complete')
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Complete an onboarding step' })
  async completeStep(
    @CurrentTenant() tenantId: string,
    @Param('stepName') stepName: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.onboardingService.completeStep(tenantId, stepName, body);
  }

  @Post('sample-data')
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Load sample data for the selected vertical' })
  async loadSampleData(
    @CurrentTenant() tenantId: string,
    @Body('vertical') vertical?: OnboardingVertical,
  ) {
    return this.onboardingService.loadSampleData(tenantId, vertical);
  }

  @Get('theme')
  @RequirePermission('settings:read')
  @ApiOperation({ summary: 'Get the tenant white-label theme' })
  async getTheme(@CurrentTenant() tenantId: string) {
    return this.whitelabelService.getTheme(tenantId);
  }

  @Put('theme')
  @RequirePermission('settings:write')
  @ApiOperation({ summary: 'Update the tenant white-label theme' })
  async updateTheme(
    @CurrentTenant() tenantId: string,
    @Body() body: OnboardingTheme,
  ) {
    return this.whitelabelService.updateTheme(tenantId, body);
  }

  @Get('branding/:slug')
  @Public()
  @ApiOperation({ summary: 'Get public branding by tenant slug' })
  async getPublicBranding(@Param('slug') slug: string) {
    return this.whitelabelService.getPublicBranding(slug);
  }
}
