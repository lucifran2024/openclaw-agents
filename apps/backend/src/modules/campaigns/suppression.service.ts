import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CampaignSuppressionEntity, SuppressionReason } from './entities/campaign-suppression.entity';
import { OptOutEntity } from './entities/opt-out.entity';

@Injectable()
export class SuppressionService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Check if a contact is suppressed (opt-out or suppression list)
   */
  async isContactSuppressed(
    tenantId: string,
    contactId: string,
  ): Promise<boolean> {
    const optOut = await this.em.findOne(OptOutEntity, {
      tenantId,
      contactId,
      channel: 'whatsapp',
    });
    if (optOut) return true;

    const suppression = await this.em.findOne(CampaignSuppressionEntity, {
      tenantId,
      contactId,
    });
    return !!suppression;
  }

  /**
   * Batch check for suppressed contacts — returns set of suppressed contact IDs
   */
  async filterSuppressedContacts(
    tenantId: string,
    contactIds: string[],
  ): Promise<Set<string>> {
    if (contactIds.length === 0) return new Set();

    const optOuts = await this.em.find(OptOutEntity, {
      tenantId,
      contactId: { $in: contactIds },
      channel: 'whatsapp',
    });

    const suppressions = await this.em.find(CampaignSuppressionEntity, {
      tenantId,
      contactId: { $in: contactIds },
    });

    const suppressed = new Set<string>();
    for (const o of optOuts) suppressed.add(o.contactId);
    for (const s of suppressions) suppressed.add(s.contactId);

    return suppressed;
  }

  async addSuppression(
    tenantId: string,
    contactId: string,
    reason: SuppressionReason,
    campaignId?: string,
  ): Promise<CampaignSuppressionEntity> {
    const suppression = this.em.create(CampaignSuppressionEntity, {
      tenantId,
      contactId,
      reason,
      campaignId,
    } as any);
    await this.em.persistAndFlush(suppression);
    return suppression;
  }

  async addOptOut(
    tenantId: string,
    contactId: string,
    reason?: string,
    channel: string = 'whatsapp',
  ): Promise<OptOutEntity> {
    // Check if already opted out
    const existing = await this.em.findOne(OptOutEntity, {
      tenantId,
      contactId,
      channel,
    });
    if (existing) return existing;

    const optOut = this.em.create(OptOutEntity, {
      tenantId,
      contactId,
      channel,
      reason,
      optedOutAt: new Date(),
    } as any);
    await this.em.persistAndFlush(optOut);
    return optOut;
  }

  async getOptOuts(
    tenantId: string,
    filters: { page?: number; limit?: number; channel?: string } = {},
  ): Promise<{ data: OptOutEntity[]; total: number }> {
    const { page = 1, limit = 20, channel } = filters;

    const where: Record<string, unknown> = { tenantId };
    if (channel) where.channel = channel;

    const [data, total] = await this.em.findAndCount(OptOutEntity, where, {
      orderBy: { createdAt: 'DESC' },
      limit,
      offset: (page - 1) * limit,
    });

    return { data, total };
  }
}
