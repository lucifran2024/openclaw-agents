import { Entity, Enum, Index, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/database/base.entity';

export enum StripeWebhookEventStatus {
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Entity({ tableName: 'stripe_webhook_events' })
@Unique({ properties: ['eventId'] })
@Index({ properties: ['status'] })
export class StripeWebhookEventEntity extends BaseEntity {
  @Property({ type: 'varchar', length: 255 })
  eventId!: string;

  @Property({ type: 'varchar', length: 120 })
  eventType!: string;

  @Enum({
    items: () => StripeWebhookEventStatus,
    default: StripeWebhookEventStatus.PROCESSING,
  })
  status: StripeWebhookEventStatus = StripeWebhookEventStatus.PROCESSING;

  @Property({ type: 'integer', default: 1 })
  attempts: number = 1;

  @Property({ type: 'timestamptz', nullable: true })
  processedAt?: Date;

  @Property({ type: 'text', nullable: true })
  lastError?: string;
}
