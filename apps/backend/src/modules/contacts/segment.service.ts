import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { SegmentEntity } from './segment.entity';
import { ContactEntity } from './contact.entity';
import { FilterQuery } from '@mikro-orm/core';

@Injectable()
export class SegmentService {
  constructor(private readonly em: EntityManager) {}

  async create(
    tenantId: string,
    name: string,
    rules: Record<string, unknown>[],
    isDynamic?: boolean,
  ): Promise<SegmentEntity> {
    const segment = this.em.create(SegmentEntity, {
      tenantId,
      name,
      rules,
      ...(isDynamic !== undefined ? { isDynamic } : {}),
    } as any);
    await this.em.persistAndFlush(segment);
    return segment;
  }

  async findAll(tenantId: string): Promise<SegmentEntity[]> {
    return this.em.find(
      SegmentEntity,
      { tenantId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  async computeSegment(
    tenantId: string,
    segmentId: string,
  ): Promise<SegmentEntity | null> {
    const segment = await this.em.findOne(SegmentEntity, {
      id: segmentId,
      tenantId,
    });
    if (!segment) return null;

    const where: FilterQuery<ContactEntity> = {
      tenantId,
      deletedAt: null,
    };

    for (const rule of segment.rules) {
      const { field, operator, value } = rule as {
        field: string;
        operator: string;
        value: unknown;
      };

      switch (operator) {
        case 'eq':
          (where as Record<string, unknown>)[field] = value;
          break;
        case 'neq':
          (where as Record<string, unknown>)[field] = { $ne: value };
          break;
        case 'contains':
          (where as Record<string, unknown>)[field] = {
            $ilike: `%${value}%`,
          };
          break;
        case 'gt':
          (where as Record<string, unknown>)[field] = { $gt: value };
          break;
        case 'gte':
          (where as Record<string, unknown>)[field] = { $gte: value };
          break;
        case 'lt':
          (where as Record<string, unknown>)[field] = { $lt: value };
          break;
        case 'lte':
          (where as Record<string, unknown>)[field] = { $lte: value };
          break;
        case 'in':
          (where as Record<string, unknown>)[field] = { $in: value };
          break;
      }
    }

    const count = await this.em.count(ContactEntity, where);

    segment.contactCount = count;
    segment.lastComputedAt = new Date();
    await this.em.flush();

    return segment;
  }
}
