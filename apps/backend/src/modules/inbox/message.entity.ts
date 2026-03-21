import { Entity, Property, Enum, Index, Unique } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../common/database/base.entity';

export enum MessageSenderType {
  CONTACT = 'contact',
  AGENT = 'agent',
  BOT = 'bot',
  SYSTEM = 'system',
}

export enum MessageContentType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  TEMPLATE = 'template',
  INTERACTIVE = 'interactive',
  LOCATION = 'location',
  STICKER = 'sticker',
  REACTION = 'reaction',
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum MessageSource {
  WEBHOOK = 'webhook',
  IMPORT = 'import',
  MIGRATION = 'migration',
}

@Entity({ tableName: 'messages' })
@Index({
  expression:
    'CREATE INDEX idx_messages_conversation_created ON messages (conversation_id, created_at)',
})
@Unique({
  expression:
    'CREATE UNIQUE INDEX idx_messages_tenant_idempotency ON messages (tenant_id, idempotency_key) WHERE idempotency_key IS NOT NULL',
})
export class MessageEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 26 })
  conversationId!: string;

  @Enum({ items: () => MessageSenderType })
  senderType!: MessageSenderType;

  @Property({ type: 'varchar', length: 26, nullable: true })
  senderId?: string;

  @Enum({ items: () => MessageContentType })
  contentType!: MessageContentType;

  @Property({ type: 'jsonb' })
  content!: Record<string, unknown>;

  @Property({ type: 'varchar', nullable: true })
  externalId?: string;

  @Enum({ items: () => MessageStatus, default: MessageStatus.PENDING })
  status: MessageStatus = MessageStatus.PENDING;

  @Property({ type: 'varchar', nullable: true })
  errorCode?: string;

  @Property({ type: 'varchar', nullable: true })
  idempotencyKey?: string;

  @Enum({ items: () => MessageSource, default: MessageSource.WEBHOOK })
  source: MessageSource = MessageSource.WEBHOOK;

  @Property({ type: 'boolean', default: false })
  imported: boolean = false;
}
