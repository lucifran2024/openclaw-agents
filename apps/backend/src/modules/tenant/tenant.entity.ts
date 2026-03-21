import { Entity, Property, Enum } from '@mikro-orm/core';
import { BaseEntity } from '../../common/database/base.entity';

@Entity({ tableName: 'tenants' })
export class TenantEntity extends BaseEntity {
  @Property()
  name!: string;

  @Property({ unique: true })
  slug!: string;

  @Property({ nullable: true })
  planId?: string;

  @Property({ nullable: true })
  stripeCustomerId?: string;

  @Property({ type: 'boolean', default: false })
  ssoEnabled: boolean = false;

  @Enum({ items: () => ['active', 'trial', 'past_due', 'suspended', 'cancelled'], default: 'trial' })
  status: string = 'trial';

  @Enum({ items: () => ['clinic', 'salon', 'restaurant', 'ecommerce', 'services', 'general'], default: 'general' })
  vertical: string = 'general';

  @Property({ type: 'jsonb', default: '{}' })
  settings: Record<string, unknown> = {};
}
