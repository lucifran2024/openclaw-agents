import { Entity, Property, Index, Unique } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../common/database/base.entity';

@Entity({ tableName: 'webhook_events' })
@Index({ properties: ['tenantId', 'eventType'] })
@Index({ properties: ['processed'] })
export class WebhookEventEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 100 })
  eventType!: string;

  @Property({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Property({ type: 'boolean', default: false })
  processed: boolean = false;

  @Property({ type: 'varchar', length: 255 })
  @Unique()
  idempotencyKey!: string;

  @Property({ type: 'timestamptz', nullable: true })
  processedAt?: Date;
}
