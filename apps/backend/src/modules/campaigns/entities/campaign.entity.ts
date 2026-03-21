import { Entity, Property, Index, Enum } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CampaignType {
  BROADCAST = 'broadcast',
  TRIGGERED = 'triggered',
}

export interface CampaignSettings {
  estimatedCost?: number;
  targetCount?: number;
  phoneNumberId?: string;
}

export interface CampaignStats {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  optedOut: number;
}

@Entity({ tableName: 'campaigns' })
@Index({ properties: ['tenantId', 'status'] })
@Index({ properties: ['tenantId', 'createdBy'] })
export class CampaignEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 255 })
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Enum({ items: () => CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus = CampaignStatus.DRAFT;

  @Enum({ items: () => CampaignType, default: CampaignType.BROADCAST })
  type: CampaignType = CampaignType.BROADCAST;

  @Property({ type: 'varchar', length: 26 })
  templateId!: string;

  @Property({ type: 'varchar', length: 26, nullable: true })
  segmentId?: string;

  @Property({ type: 'timestamptz', nullable: true })
  scheduledAt?: Date;

  @Property({ type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Property({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Property({ type: 'jsonb', default: '{}' })
  settings: CampaignSettings = {};

  @Property({ type: 'jsonb', default: '{"sent":0,"delivered":0,"read":0,"failed":0,"optedOut":0}' })
  stats: CampaignStats = { sent: 0, delivered: 0, read: 0, failed: 0, optedOut: 0 };

  @Property({ type: 'varchar', length: 26 })
  createdBy!: string;
}
