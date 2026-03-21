import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ContactEntity, ContactStatus } from './contact.entity';
import { ContactTagEntity } from './contact-tag.entity';

export interface ContactFilters {
  search?: string;
  tags?: string[];
  status?: ContactStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class ContactService {
  constructor(private readonly em: EntityManager) {}

  async create(
    tenantId: string,
    data: Partial<ContactEntity>,
  ): Promise<ContactEntity> {
    const contact = this.em.create(ContactEntity, {
      ...data,
      tenantId,
    } as any);
    await this.em.persistAndFlush(contact);
    return contact;
  }

  async findAll(
    tenantId: string,
    filters: ContactFilters = {},
  ): Promise<{ data: ContactEntity[]; total: number }> {
    const { search, tags, status, page = 1, limit = 20 } = filters;
    const qb = this.em.createQueryBuilder(ContactEntity, 'c');

    qb.where({ tenantId, deletedAt: null });

    if (search) {
      qb.andWhere({
        $or: [
          { name: { $ilike: `%${search}%` } },
          { email: { $ilike: `%${search}%` } },
          { phone: { $ilike: `%${search}%` } },
        ],
      });
    }

    if (status) {
      qb.andWhere({ status });
    }

    if (tags && tags.length > 0) {
      const subQb = this.em
        .createQueryBuilder(ContactTagEntity, 'ct')
        .select('ct.contactId')
        .where({ tagId: { $in: tags } });
      qb.andWhere({ id: { $in: subQb.getKnexQuery() } });
    }

    const total = await qb.clone().getCount();

    const data = await qb
      .orderBy({ createdAt: 'DESC' })
      .limit(limit)
      .offset((page - 1) * limit)
      .getResultList();

    return { data, total };
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<ContactEntity | null> {
    return this.em.findOne(ContactEntity, {
      id,
      tenantId,
      deletedAt: null,
    });
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<ContactEntity>,
  ): Promise<ContactEntity | null> {
    const contact = await this.findById(tenantId, id);
    if (!contact) return null;

    this.em.assign(contact, data);
    await this.em.flush();
    return contact;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const contact = await this.findById(tenantId, id);
    if (!contact) return false;

    contact.deletedAt = new Date();
    await this.em.flush();
    return true;
  }

  async addTags(
    tenantId: string,
    contactId: string,
    tagIds: string[],
  ): Promise<void> {
    const contact = await this.findById(tenantId, contactId);
    if (!contact) return;

    const existing = await this.em.find(ContactTagEntity, {
      contactId,
      tagId: { $in: tagIds },
    });
    const existingTagIds = new Set(existing.map((ct) => ct.tagId));

    const newTags = tagIds
      .filter((tagId) => !existingTagIds.has(tagId))
      .map((tagId) =>
        this.em.create(ContactTagEntity, { contactId, tagId } as any),
      );

    if (newTags.length > 0) {
      await this.em.persistAndFlush(newTags);
    }
  }

  async removeTags(
    tenantId: string,
    contactId: string,
    tagIds: string[],
  ): Promise<void> {
    const contact = await this.findById(tenantId, contactId);
    if (!contact) return;

    const tags = await this.em.find(ContactTagEntity, {
      contactId,
      tagId: { $in: tagIds },
    });

    if (tags.length > 0) {
      await this.em.removeAndFlush(tags);
    }
  }

  async findByPhone(
    tenantId: string,
    phone: string,
  ): Promise<ContactEntity | null> {
    return this.em.findOne(ContactEntity, {
      tenantId,
      phone,
      deletedAt: null,
    });
  }

  async findByWhatsappId(
    tenantId: string,
    whatsappId: string,
  ): Promise<ContactEntity | null> {
    return this.em.findOne(ContactEntity, {
      tenantId,
      whatsappId,
      deletedAt: null,
    });
  }
}
