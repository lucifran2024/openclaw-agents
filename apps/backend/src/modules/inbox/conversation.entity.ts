import { Entity, Property, Enum, Index } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../common/database/base.entity';

export enum ConversationChannel {
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  WEBCHAT = 'webchat',
  TELEGRAM = 'telegram',
  INSTAGRAM = 'instagram',
}

export enum ConversationType {
  DIRECT = 'direct',
  CHANNEL = 'channel',
  GROUP = 'group',
}

export enum ConversationStatus {
  OPEN = 'open',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum ConversationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity({ tableName: 'conversations' })
@Index({
  expression:
    'CREATE INDEX idx_conversations_tenant_status_last_msg ON conversations (tenant_id, status, last_message_at DESC)',
})
@Index({
  expression:
    'CREATE INDEX idx_conversations_tenant_assigned_status ON conversations (tenant_id, assigned_to, status)',
})
@Index({ properties: ['tenantId', 'contactId'] })
export class ConversationEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 26 })
  contactId!: string;

  @Enum({ items: () => ConversationChannel })
  channel!: ConversationChannel;

  @Property({ type: 'varchar', nullable: true })
  channelId?: string;

  @Enum({ items: () => ConversationType, default: ConversationType.DIRECT })
  type: ConversationType = ConversationType.DIRECT;

  @Enum({ items: () => ConversationStatus, default: ConversationStatus.OPEN })
  status: ConversationStatus = ConversationStatus.OPEN;

  @Enum({
    items: () => ConversationPriority,
    default: ConversationPriority.MEDIUM,
  })
  priority: ConversationPriority = ConversationPriority.MEDIUM;

  @Property({ type: 'varchar', length: 26, nullable: true })
  assignedTo?: string;

  @Property({ type: 'varchar', length: 26, nullable: true })
  teamId?: string;

  @Property({ type: 'varchar', length: 26, nullable: true })
  slaPolicyId?: string;

  @Property({ type: 'timestamptz', nullable: true })
  slaFirstResponseAt?: Date;

  @Property({ type: 'timestamptz', nullable: true })
  slaResolutionAt?: Date;

  @Property({ type: 'boolean', default: false })
  slaBreached: boolean = false;

  @Property({ type: 'timestamptz', nullable: true })
  sessionExpiresAt?: Date;

  @Property({ type: 'timestamptz', nullable: true })
  lastMessageAt?: Date;

  @Property({ type: 'int', default: 0 })
  messageCount: number = 0;

  @Property({ type: 'int', default: 0 })
  unreadCount: number = 0;

  @Property({ type: 'timestamptz', nullable: true })
  resolvedAt?: Date;
}
