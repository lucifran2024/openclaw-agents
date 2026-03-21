import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { TagEntity } from './tag.entity';

@Injectable()
export class TagService {
  constructor(private readonly em: EntityManager) {}

  async create(
    tenantId: string,
    name: string,
    color?: string,
  ): Promise<TagEntity> {
    const tag = this.em.create(TagEntity, {
      tenantId,
      name,
      ...(color ? { color } : {}),
    } as any);
    await this.em.persistAndFlush(tag);
    return tag;
  }

  async findAll(tenantId: string): Promise<TagEntity[]> {
    return this.em.find(TagEntity, { tenantId }, { orderBy: { name: 'ASC' } });
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<Pick<TagEntity, 'name' | 'color'>>,
  ): Promise<TagEntity | null> {
    const tag = await this.em.findOne(TagEntity, { id, tenantId });
    if (!tag) return null;

    this.em.assign(tag, data);
    await this.em.flush();
    return tag;
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const tag = await this.em.findOne(TagEntity, { id, tenantId });
    if (!tag) return false;

    await this.em.removeAndFlush(tag);
    return true;
  }
}
