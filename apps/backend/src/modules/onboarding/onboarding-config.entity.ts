import { Entity, Property, Enum, Index } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../common/database/base.entity';

export enum OnboardingVertical {
  CLINIC = 'clinic',
  SALON = 'salon',
  RESTAURANT = 'restaurant',
  ECOMMERCE = 'ecommerce',
  SERVICES = 'services',
  GENERAL = 'general',
}

export interface OnboardingTheme {
  primaryColor?: string;
  logo?: string;
  favicon?: string;
}

@Entity({ tableName: 'onboarding_configs' })
@Index({ properties: ['tenantId'], options: { unique: true } })
export class OnboardingConfigEntity extends TenantBaseEntity {
  @Enum({
    items: () => OnboardingVertical,
    default: OnboardingVertical.GENERAL,
  })
  vertical: OnboardingVertical = OnboardingVertical.GENERAL;

  @Property({ type: 'jsonb', default: '[]' })
  completedSteps: string[] = [];

  @Property({ type: 'boolean', default: false })
  isComplete: boolean = false;

  @Property({ type: 'jsonb', default: '{}' })
  theme: OnboardingTheme = {};

  @Property({ type: 'boolean', default: false })
  sampleDataLoaded: boolean = false;
}
