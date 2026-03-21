import { Entity, Property, Index, Enum } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

export enum SuppressionReason {
  OPT_OUT = 'opt_out',
  BOUNCE = 'bounce',
  COMPLAINT = 'complaint',
  MANUAL = 'manual',
}

@Entity({ tableName: 'campaign_suppressions' })
@Index({ properties: ['tenantId', 'contactId'] })
export class CampaignSuppressionEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 26 })
  contactId!: string;

  @Enum({ items: () => SuppressionReason })
  reason!: SuppressionReason;

  @Property({ type: 'varchar', length: 26, nullable: true })
  campaignId?: string;
}
