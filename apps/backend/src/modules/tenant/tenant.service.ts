import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { TenantEntity } from './tenant.entity';

@Injectable()
export class TenantService {
  constructor(private readonly em: EntityManager) {}

  async create(data: { name: string; slug: string; vertical?: string }): Promise<TenantEntity> {
    const existing = await this.em.findOne(TenantEntity, { slug: data.slug });
    if (existing) {
      throw new ConflictException('Slug already exists');
    }

    const tenant = this.em.create(TenantEntity, {
      name: data.name,
      slug: data.slug,
      vertical: data.vertical || 'general',
      status: 'trial',
    } as any);

    await this.em.persistAndFlush(tenant);
    return tenant;
  }

  async findById(id: string): Promise<TenantEntity> {
    const tenant = await this.em.findOne(TenantEntity, { id });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findBySlug(slug: string): Promise<TenantEntity | null> {
    return this.em.findOne(TenantEntity, { slug });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      vertical: string;
      settings: Record<string, unknown>;
      status: string;
      ssoEnabled: boolean;
    }>,
  ): Promise<TenantEntity> {
    const tenant = await this.findById(id);

    if (data.slug && data.slug !== tenant.slug) {
      const existing = await this.em.findOne(TenantEntity, { slug: data.slug });
      if (existing && existing.id !== id) {
        throw new ConflictException('Slug already exists');
      }
    }

    this.em.assign(tenant, data);
    await this.em.flush();
    return tenant;
  }
}
