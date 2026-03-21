import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ServiceTypeEntity } from './entities/service-type.entity';
import { ResourceEntity } from './entities/resource.entity';
import { ScheduleRuleEntity } from './entities/schedule-rule.entity';
import { ScheduleExceptionEntity, ScheduleExceptionType } from './entities/schedule-exception.entity';

@Injectable()
export class SchedulingService {
  constructor(private readonly em: EntityManager) {}

  // ── Service Types ──────────────────────────────────────────────

  async createServiceType(tenantId: string, data: Partial<ServiceTypeEntity>): Promise<ServiceTypeEntity> {
    const entity = this.em.create(ServiceTypeEntity, {
      ...data,
      tenantId,
    } as any);
    await this.em.persistAndFlush(entity);
    return entity;
  }

  async findAllServiceTypes(tenantId: string): Promise<ServiceTypeEntity[]> {
    return this.em.find(ServiceTypeEntity, { tenantId, isActive: true });
  }

  async findServiceTypeById(tenantId: string, id: string): Promise<ServiceTypeEntity | null> {
    return this.em.findOne(ServiceTypeEntity, { id, tenantId });
  }

  async updateServiceType(tenantId: string, id: string, data: Partial<ServiceTypeEntity>): Promise<ServiceTypeEntity | null> {
    const entity = await this.findServiceTypeById(tenantId, id);
    if (!entity) return null;
    this.em.assign(entity, data);
    await this.em.flush();
    return entity;
  }

  async deleteServiceType(tenantId: string, id: string): Promise<boolean> {
    const entity = await this.findServiceTypeById(tenantId, id);
    if (!entity) return false;
    entity.isActive = false;
    await this.em.flush();
    return true;
  }

  // ── Resources ──────────────────────────────────────────────────

  async createResource(tenantId: string, data: Partial<ResourceEntity>): Promise<ResourceEntity> {
    const entity = this.em.create(ResourceEntity, {
      ...data,
      tenantId,
    } as any);
    await this.em.persistAndFlush(entity);
    return entity;
  }

  async findAllResources(tenantId: string): Promise<ResourceEntity[]> {
    return this.em.find(ResourceEntity, { tenantId, isActive: true });
  }

  async findResourceById(tenantId: string, id: string): Promise<ResourceEntity | null> {
    return this.em.findOne(ResourceEntity, { id, tenantId });
  }

  async updateResource(tenantId: string, id: string, data: Partial<ResourceEntity>): Promise<ResourceEntity | null> {
    const entity = await this.findResourceById(tenantId, id);
    if (!entity) return null;
    this.em.assign(entity, data);
    await this.em.flush();
    return entity;
  }

  async deleteResource(tenantId: string, id: string): Promise<boolean> {
    const entity = await this.findResourceById(tenantId, id);
    if (!entity) return false;
    entity.isActive = false;
    await this.em.flush();
    return true;
  }

  // ── Schedule Rules ─────────────────────────────────────────────

  async createScheduleRule(tenantId: string, data: Partial<ScheduleRuleEntity>): Promise<ScheduleRuleEntity> {
    const entity = this.em.create(ScheduleRuleEntity, {
      ...data,
      tenantId,
    } as any);
    await this.em.persistAndFlush(entity);
    return entity;
  }

  async getScheduleRules(tenantId: string, resourceId: string): Promise<ScheduleRuleEntity[]> {
    return this.em.find(ScheduleRuleEntity, { tenantId, resourceId, isActive: true });
  }

  async updateScheduleRule(tenantId: string, id: string, data: Partial<ScheduleRuleEntity>): Promise<ScheduleRuleEntity | null> {
    const entity = await this.em.findOne(ScheduleRuleEntity, { id, tenantId });
    if (!entity) return null;
    this.em.assign(entity, data);
    await this.em.flush();
    return entity;
  }

  async deleteScheduleRule(tenantId: string, id: string): Promise<boolean> {
    const entity = await this.em.findOne(ScheduleRuleEntity, { id, tenantId });
    if (!entity) return false;
    entity.isActive = false;
    await this.em.flush();
    return true;
  }

  // ── Schedule Exceptions ────────────────────────────────────────

  async createException(
    tenantId: string,
    data: {
      resourceId: string;
      date: Date;
      startTime?: string;
      endTime?: string;
      reason?: string;
      type: ScheduleExceptionType;
    },
  ): Promise<ScheduleExceptionEntity> {
    const entity = this.em.create(ScheduleExceptionEntity, {
      ...data,
      tenantId,
    } as any);
    await this.em.persistAndFlush(entity);
    return entity;
  }

  async getExceptions(
    tenantId: string,
    resourceId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<ScheduleExceptionEntity[]> {
    return this.em.find(ScheduleExceptionEntity, {
      tenantId,
      resourceId,
      date: { $gte: dateFrom, $lte: dateTo },
    });
  }
}
