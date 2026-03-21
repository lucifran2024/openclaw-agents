import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConversationEntity,
  ConversationChannel,
  ConversationStatus,
  ConversationType,
  ConversationPriority,
} from './conversation.entity';

export interface ConversationFilters {
  status?: ConversationStatus;
  assignedTo?: string;
  teamId?: string;
  channel?: ConversationChannel;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ConversationService {
  constructor(private readonly em: EntityManager) {}

  async create(
    tenantId: string,
    data: {
      contactId: string;
      channel: ConversationChannel;
      channelId?: string;
      type?: ConversationType;
      priority?: ConversationPriority;
    },
  ): Promise<ConversationEntity> {
    const conversation = this.em.create(ConversationEntity, {
      tenantId,
      contactId: data.contactId,
      channel: data.channel,
      channelId: data.channelId,
      type: data.type ?? ConversationType.DIRECT,
      priority: data.priority ?? ConversationPriority.MEDIUM,
    } as any);
    await this.em.persistAndFlush(conversation);
    return conversation;
  }

  async findAll(
    tenantId: string,
    filters: ConversationFilters = {},
  ): Promise<{ data: ConversationEntity[]; total: number }> {
    const {
      status,
      assignedTo,
      teamId,
      channel,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const qb = this.em.createQueryBuilder(ConversationEntity, 'c');
    qb.where({ tenantId });

    if (status) {
      qb.andWhere({ status });
    }

    if (assignedTo) {
      qb.andWhere({ assignedTo });
    }

    if (teamId) {
      qb.andWhere({ teamId });
    }

    if (channel) {
      qb.andWhere({ channel });
    }

    if (search) {
      qb.andWhere({ contactId: { $ilike: `%${search}%` } });
    }

    const total = await qb.clone().getCount();

    const data = await qb
      .orderBy({ lastMessageAt: 'DESC NULLS LAST' })
      .limit(limit)
      .offset((page - 1) * limit)
      .getResultList();

    return { data, total };
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<ConversationEntity | null> {
    return this.em.findOne(ConversationEntity, { id, tenantId });
  }

  async findByChannelId(
    tenantId: string,
    channel: ConversationChannel,
    channelId: string,
  ): Promise<ConversationEntity | null> {
    return this.em.findOne(ConversationEntity, {
      tenantId,
      channel,
      channelId,
    });
  }

  async assign(
    tenantId: string,
    conversationId: string,
    userId: string,
  ): Promise<ConversationEntity | null> {
    const conversation = await this.findById(tenantId, conversationId);
    if (!conversation) return null;

    conversation.assignedTo = userId;
    await this.em.flush();
    return conversation;
  }

  async transfer(
    tenantId: string,
    conversationId: string,
    toUserId: string,
    _fromUserId?: string,
  ): Promise<ConversationEntity | null> {
    const conversation = await this.findById(tenantId, conversationId);
    if (!conversation) return null;

    conversation.assignedTo = toUserId;
    await this.em.flush();
    return conversation;
  }

  async updateStatus(
    tenantId: string,
    conversationId: string,
    status: ConversationStatus,
  ): Promise<ConversationEntity | null> {
    const conversation = await this.findById(tenantId, conversationId);
    if (!conversation) return null;

    conversation.status = status;

    if (status === ConversationStatus.RESOLVED) {
      conversation.resolvedAt = new Date();
    }

    await this.em.flush();
    return conversation;
  }

  async incrementMessageCount(
    tenantId: string,
    conversationId: string,
  ): Promise<void> {
    await this.em
      .createQueryBuilder(ConversationEntity)
      .update({
        messageCount: (this.em as any).raw('message_count + 1'),
        unreadCount: (this.em as any).raw('unread_count + 1'),
      })
      .where({ id: conversationId, tenantId })
      .execute();
  }

  async updateLastMessageAt(
    tenantId: string,
    conversationId: string,
    date: Date,
  ): Promise<void> {
    await this.em
      .createQueryBuilder(ConversationEntity)
      .update({ lastMessageAt: date })
      .where({ id: conversationId, tenantId })
      .execute();
  }

  async updateSessionWindow(
    tenantId: string,
    conversationId: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.em
      .createQueryBuilder(ConversationEntity)
      .update({ sessionExpiresAt: expiresAt })
      .where({ id: conversationId, tenantId })
      .execute();
  }
}
