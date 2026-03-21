import { Entity, Property, Index, Enum, Unique } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

export enum CampaignMessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  OPTED_OUT = 'opted_out',
}

@Entity({ tableName: 'campaign_messages' })
@Index({ properties: ['tenantId', 'campaignId'] })
@Index({ properties: ['tenantId', 'contactId'] })
@Index({ properties: ['tenantId', 'status'] })
@Unique({ properties: ['tenantId', 'idempotencyKey'] })
export class CampaignMessageEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 26 })
  campaignId!: string;

  @Property({ type: 'varchar', length: 26 })
  contactId!: string;

  @Property({ type: 'varchar', length: 26, nullable: true })
  messageId?: string;

  @Enum({ items: () => CampaignMessageStatus, default: CampaignMessageStatus.PENDING })
  status: CampaignMessageStatus = CampaignMessageStatus.PENDING;

  @Property({ type: 'varchar', length: 100, nullable: true })
  errorCode?: string;

  @Property({ type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Property({ type: 'timestamptz', nullable: true })
  deliveredAt?: Date;

  @Property({ type: 'timestamptz', nullable: true })
  readAt?: Date;

  @Property({ type: 'varchar', length: 255 })
  idempotencyKey!: string;
}
