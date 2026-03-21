import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { TenantService } from '../tenant/tenant.service';
import { OnboardingTheme, OnboardingConfigEntity } from './onboarding-config.entity';
import { OnboardingService } from './onboarding.service';

@Injectable()
export class WhitelabelService {
  constructor(
    private readonly em: EntityManager,
    private readonly tenantService: TenantService,
    private readonly onboardingService: OnboardingService,
  ) {}

  async getTheme(tenantId: string): Promise<OnboardingTheme> {
    const status = await this.onboardingService.getOnboardingStatus(tenantId);
    return status.theme;
  }

  async updateTheme(tenantId: string, theme: OnboardingTheme): Promise<OnboardingTheme> {
    return this.onboardingService.applyTheme(tenantId, theme);
  }

  async getPublicBranding(slug: string) {
    const tenant = await this.tenantService.findBySlug(slug);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const config = await this.em.findOne(OnboardingConfigEntity, { tenantId: tenant.id });
    const theme =
      config?.theme ||
      ((tenant.settings?.theme as OnboardingTheme | undefined) ?? {});

    return {
      name: tenant.name,
      slug: tenant.slug,
      vertical: tenant.vertical,
      theme,
    };
  }
}
