import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  MessageEntity,
  MessageSenderType,
  MessageContentType,
  MessageStatus,
  MessageSource,
} from './message.entity';

@Injectable()
export class MessageService {
  constructor(private readonly em: EntityManager) {}

  async create(
    tenantId: string,
    data: {
      conversationId: string;
      senderType: MessageSenderType;
      senderId?: string;
      contentType: MessageContentType;
      content: Record<string, unknown>;
      externalId?: string;
      idempotencyKey?: string;
      source?: MessageSource;
    },
  ): Promise<MessageEntity> {
    if (data.idempotencyKey) {
      const existing = await this.findByIdempotencyKey(
        tenantId,
        data.idempotencyKey,
      );
      if (existing) return existing;
    }

    const message = this.em.create(MessageEntity, {
      tenantId,
      conversationId: data.conversationId,
      senderType: data.senderType,
      senderId: data.senderId,
      contentType: data.contentType,
      content: data.content,
      externalId: data.externalId,
      idempotencyKey: data.idempotencyKey,
      source: data.source ?? MessageSource.WEBHOOK,
      imported: data.source === MessageSource.IMPORT || data.source === MessageSource.MIGRATION,
    } as any);
    await this.em.persistAndFlush(message);
    return message;
  }

  async findByConversation(
    tenantId: string,
    conversationId: string,
    options: { before?: string; limit?: number } = {},
  ): Promise<{ data: MessageEntity[]; hasMore: boolean }> {
    const { before, limit = 50 } = options;

    const qb = this.em.createQueryBuilder(MessageEntity, 'm');
    qb.where({ tenantId, conversationId });

    if (before) {
      qb.andWhere({ createdAt: { $lt: new Date(before) } });
    }

    const data = await qb
      .orderBy({ createdAt: 'DESC' })
      .limit(limit + 1)
      .getResultList();

    const hasMore = data.length > limit;
    if (hasMore) {
      data.pop();
    }

    return { data, hasMore };
  }

  async updateStatus(
    tenantId: string,
    messageId: string,
    status: MessageStatus,
  ): Promise<MessageEntity | null> {
    const message = await this.em.findOne(MessageEntity, {
      id: messageId,
      tenantId,
    });
    if (!message) return null;

    message.status = status;
    await this.em.flush();
    return message;
  }

  async updateStatusByExternalId(
    tenantId: string,
    externalId: string,
    status: MessageStatus,
  ): Promise<MessageEntity | null> {
    const message = await this.em.findOne(MessageEntity, {
      tenantId,
      externalId,
    });
    if (!message) return null;

    message.status = status;
    await this.em.flush();
    return message;
  }

  async findByIdempotencyKey(
    tenantId: string,
    key: string,
  ): Promise<MessageEntity | null> {
    return this.em.findOne(MessageEntity, {
      tenantId,
      idempotencyKey: key,
    });
  }
}
