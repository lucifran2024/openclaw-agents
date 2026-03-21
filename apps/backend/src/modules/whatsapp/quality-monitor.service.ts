import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { WhatsAppAccountEntity, QualityRating } from './whatsapp-account.entity';

@Injectable()
export class QualityMonitorService {
  private readonly logger = new Logger(QualityMonitorService.name);

  constructor(private readonly em: EntityManager) {}

  async updateQuality(
    tenantId: string,
    phoneNumberId: string,
    qualityRating: QualityRating,
  ): Promise<void> {
    const fork = this.em.fork();
    const account = await fork.findOne(WhatsAppAccountEntity, {
      tenantId,
      phoneNumberId,
    });

    if (!account) {
      this.logger.warn(
        `Account not found for tenant ${tenantId}, phoneNumberId ${phoneNumberId}`,
      );
      return;
    }

    const previousRating = account.qualityRating;
    account.qualityRating = qualityRating;
    await fork.flush();

    this.logger.log(
      `Quality updated for ${phoneNumberId}: ${previousRating} -> ${qualityRating}`,
    );
  }

  async getQuality(tenantId: string, phoneNumberId: string): Promise<QualityRating | null> {
    const fork = this.em.fork();
    const account = await fork.findOne(WhatsAppAccountEntity, {
      tenantId,
      phoneNumberId,
    });

    return account?.qualityRating ?? null;
  }

  async shouldReducePacing(tenantId: string, phoneNumberId: string): Promise<boolean> {
    const quality = await this.getQuality(tenantId, phoneNumberId);
    return quality === QualityRating.YELLOW;
  }

  async shouldBlockSending(tenantId: string, phoneNumberId: string): Promise<boolean> {
    const quality = await this.getQuality(tenantId, phoneNumberId);
    return quality === QualityRating.RED;
  }
}
