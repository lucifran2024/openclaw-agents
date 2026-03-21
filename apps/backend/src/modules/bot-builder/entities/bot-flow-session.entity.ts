import { Entity, Property, Enum, Index, PrimaryKey } from '@mikro-orm/core';
import { ulid } from 'ulid';

export enum SessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

@Entity({ tableName: 'bot_flow_sessions' })
@Index({ properties: ['tenantId', 'flowId'] })
@Index({ properties: ['tenantId', 'conversationId'] })
@Index({ properties: ['tenantId', 'contactId'] })
@Index({ properties: ['tenantId', 'status'] })
export class BotFlowSessionEntity {
  @PrimaryKey({ type: 'varchar', length: 26 })
  id: string = ulid();

  @Property({ type: 'varchar', length: 26 })
  tenantId!: string;

  @Property({ type: 'varchar', length: 26 })
  flowId!: string;

  @Property({ type: 'varchar', length: 26 })
  conversationId!: string;

  @Property({ type: 'varchar', length: 26 })
  contactId!: string;

  @Property({ type: 'varchar', length: 26 })
  currentNodeId!: string;

  @Enum({ items: () => SessionStatus, default: SessionStatus.ACTIVE })
  status: SessionStatus = SessionStatus.ACTIVE;

  @Property({ type: 'jsonb', default: '{}' })
  variables: Record<string, unknown> = {};

  @Property({ type: 'timestamptz' })
  startedAt: Date = new Date();

  @Property({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Property({ type: 'timestamptz' })
  lastActivityAt: Date = new Date();

  @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
  createdAt: Date = new Date();
}
