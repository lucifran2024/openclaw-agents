import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { AuditLogEntity } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(private readonly em: EntityManager) {}

  async log(data: {
    tenantId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    const entry = this.em.create(AuditLogEntity, data as any);
    await this.em.persistAndFlush(entry);
  }

  async findByTenant(tenantId: string, options?: { limit?: number; offset?: number }) {
    return this.em.find(
      AuditLogEntity,
      { tenantId },
      {
        orderBy: { createdAt: 'DESC' },
        limit: options?.limit || 50,
        offset: options?.offset || 0,
      },
    );
  }
}
