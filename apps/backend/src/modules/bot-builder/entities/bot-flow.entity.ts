import { Entity, Property, Enum, Index } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

export enum FlowStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum TriggerType {
  KEYWORD = 'keyword',
  WEBHOOK = 'webhook',
  SCHEDULE = 'schedule',
  MANUAL = 'manual',
  CONVERSATION_START = 'conversation_start',
}

@Entity({ tableName: 'bot_flows' })
@Index({ properties: ['tenantId', 'status'] })
@Index({ properties: ['tenantId', 'triggerType'] })
export class BotFlowEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 255 })
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Enum({ items: () => FlowStatus, default: FlowStatus.DRAFT })
  status: FlowStatus = FlowStatus.DRAFT;

  @Property({ type: 'int', default: 1 })
  version: number = 1;

  @Enum({ items: () => TriggerType })
  triggerType!: TriggerType;

  @Property({ type: 'jsonb', default: '{}' })
  triggerConfig: Record<string, unknown> = {};

  @Property({ type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @Property({ type: 'varchar', length: 26 })
  createdBy!: string;
}
