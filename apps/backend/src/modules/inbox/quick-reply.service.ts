import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { QuickReplyEntity } from './quick-reply.entity';

@Injectable()
export class QuickReplyService {
  constructor(private readonly em: EntityManager) {}

  async findAll(tenantId: string): Promise<QuickReplyEntity[]> {
    return this.em.find(QuickReplyEntity, { tenantId }, { orderBy: { shortcut: 'ASC' } });
  }

  async create(
    tenantId: string,
    userId: string,
    data: Pick<QuickReplyEntity, 'shortcut' | 'content'>,
  ): Promise<QuickReplyEntity> {
    const reply = this.em.create(QuickReplyEntity, {
      tenantId,
      createdBy: userId,
      shortcut: data.shortcut,
      content: data.content,
    } as any);

    await this.em.persistAndFlush(reply);
    return reply;
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<Pick<QuickReplyEntity, 'shortcut' | 'content'>>,
  ): Promise<QuickReplyEntity | null> {
    const reply = await this.em.findOne(QuickReplyEntity, { tenantId, id });
    if (!reply) return null;

    this.em.assign(reply, data);
    await this.em.flush();
    return reply;
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const reply = await this.em.findOne(QuickReplyEntity, { tenantId, id });
    if (!reply) return false;

    await this.em.removeAndFlush(reply);
    return true;
  }
}
