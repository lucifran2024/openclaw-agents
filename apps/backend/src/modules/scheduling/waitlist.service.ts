import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WaitlistEntity, WaitlistStatus } from './entities/waitlist.entity';

export interface WaitlistFilters {
  serviceTypeId?: string;
  resourceId?: string;
  status?: WaitlistStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(
    private readonly em: EntityManager,
    @InjectQueue('scheduling_waitlist') private readonly waitlistQueue: Queue,
  ) {}

  async addToWaitlist(
    tenantId: string,
    data: {
      contactId: string;
      serviceTypeId: string;
      resourceId?: string;
      preferredDateStart: string;
      preferredDateEnd: string;
      preferredTimeStart?: string;
      preferredTimeEnd?: string;
    },
  ): Promise<WaitlistEntity> {
    const entity = this.em.create(WaitlistEntity, {
      tenantId,
      contactId: data.contactId,
      serviceTypeId: data.serviceTypeId,
      resourceId: data.resourceId,
      preferredDateStart: new Date(data.preferredDateStart),
      preferredDateEnd: new Date(data.preferredDateEnd),
      preferredTimeStart: data.preferredTimeStart,
      preferredTimeEnd: data.preferredTimeEnd,
      status: WaitlistStatus.WAITING,
    } as any);

    await this.em.persistAndFlush(entity);
    this.logger.log(`Added to waitlist: ${entity.id} for tenant ${tenantId}`);
    return entity;
  }

  async removeFromWaitlist(tenantId: string, id: string): Promise<boolean> {
    const entity = await this.em.findOne(WaitlistEntity, { id, tenantId });
    if (!entity) return false;

    entity.status = WaitlistStatus.CANCELLED;
    await this.em.flush();
    return true;
  }

  async getWaitlist(
    tenantId: string,
    filters: WaitlistFilters = {},
  ): Promise<{ data: WaitlistEntity[]; total: number }> {
    const { serviceTypeId, resourceId, status, page = 1, limit = 20 } = filters;

    const where: Record<string, any> = { tenantId };
    if (serviceTypeId) where.serviceTypeId = serviceTypeId;
    if (resourceId) where.resourceId = resourceId;
    if (status) where.status = status;

    const [data, total] = await this.em.findAndCount(WaitlistEntity, where, {
      orderBy: { createdAt: 'ASC' },
      limit,
      offset: (page - 1) * limit,
    });

    return { data, total };
  }

  async processWaitlist(
    tenantId: string,
    resourceId: string,
    availableSlot: { startAt: string; endAt: string; serviceTypeId: string },
  ): Promise<WaitlistEntity[]> {
    const slotDate = new Date(availableSlot.startAt);
    const slotTime = `${slotDate.getHours().toString().padStart(2, '0')}:${slotDate.getMinutes().toString().padStart(2, '0')}`;

    // Find matching waitlist entries
    const matches = await this.em.find(
      WaitlistEntity,
      {
        tenantId,
        serviceTypeId: availableSlot.serviceTypeId,
        status: WaitlistStatus.WAITING,
        preferredDateStart: { $lte: slotDate },
        preferredDateEnd: { $gte: slotDate },
        $or: [
          { resourceId: null as any },
          { resourceId },
        ],
      },
      { orderBy: { createdAt: 'ASC' } },
    );

    // Filter by preferred time if set
    const eligible = matches.filter((entry) => {
      if (entry.preferredTimeStart && slotTime < entry.preferredTimeStart) return false;
      if (entry.preferredTimeEnd && slotTime > entry.preferredTimeEnd) return false;
      return true;
    });

    // Mark top matches as offered
    const offered: WaitlistEntity[] = [];
    for (const entry of eligible.slice(0, 3)) {
      entry.status = WaitlistStatus.OFFERED;
      entry.offeredAt = new Date();
      // Set expiry for 2 hours
      entry.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
      offered.push(entry);
    }

    if (offered.length > 0) {
      await this.em.flush();
      this.logger.log(`Offered slot to ${offered.length} waitlist entries for tenant ${tenantId}`);
    }

    return offered;
  }
}
