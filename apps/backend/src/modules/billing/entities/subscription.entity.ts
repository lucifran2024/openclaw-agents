import { Entity, Property, Enum, Index } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  TRIALING = 'trialing',
}

@Entity({ tableName: 'subscriptions' })
@Index({ properties: ['tenantId'] })
@Index({ properties: ['tenantId', 'status'] })
export class SubscriptionEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 26 })
  planId!: string;

  @Enum({ items: () => SubscriptionStatus, default: SubscriptionStatus.TRIALING })
  status: SubscriptionStatus = SubscriptionStatus.TRIALING;

  @Property({ type: 'timestamptz' })
  currentPeriodStart!: Date;

  @Property({ type: 'timestamptz' })
  currentPeriodEnd!: Date;

  @Property({ type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @Property({ type: 'timestamptz', nullable: true })
  trialEndsAt?: Date;

  @Property({ type: 'varchar', length: 255, nullable: true })
  externalId?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  stripeCustomerId?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  stripePriceId?: string;

  @Property({ type: 'boolean', default: false })
  cancelAtPeriodEnd: boolean = false;
}
