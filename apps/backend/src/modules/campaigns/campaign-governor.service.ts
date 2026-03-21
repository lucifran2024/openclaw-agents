import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectRedis } from '../../common/redis/inject-redis.decorator';
import Redis from 'ioredis';
import { WhatsAppAccountEntity, QualityRating } from '../whatsapp/whatsapp-account.entity';
import { CampaignEntity } from './entities/campaign.entity';

export interface GovernorDecision {
  proceed: boolean;
  reason?: string;
  reducePacing?: boolean;
}

@Injectable()
export class CampaignGovernorService {
  private readonly logger = new Logger(CampaignGovernorService.name);

  constructor(
    private readonly em: EntityManager,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * Dimension 1: Quality rating check
   */
  async checkQualityRating(
    tenantId: string,
    phoneNumberId: string,
  ): Promise<QualityRating> {
    const fork = this.em.fork();
    const account = await fork.findOne(WhatsAppAccountEntity, {
      tenantId,
      phoneNumberId,
    });

    if (!account) {
      this.logger.warn(`Account not found: ${phoneNumberId}`);
      return QualityRating.RED;
    }

    return account.qualityRating;
  }

  /**
   * Dimension 2: Messaging limits — conversations remaining today
   */
  async getConversationsRemaining(
    tenantId: string,
    phoneNumberId: string,
  ): Promise<number> {
    const fork = this.em.fork();
    const account = await fork.findOne(WhatsAppAccountEntity, {
      tenantId,
      phoneNumberId,
    });

    if (!account) return 0;

    const tierLimit = parseInt(account.messagingTier, 10) || 1000;
    const today = new Date().toISOString().split('T')[0];
    const key = `wa:convos:${phoneNumberId}:${today}`;
    const used = parseInt(await this.redis.get(key) || '0', 10);

    return Math.max(0, tierLimit - used);
  }

  /**
   * Increment the daily conversation counter
   */
  async incrementConversationCount(
    phoneNumberId: string,
    count: number = 1,
  ): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const key = `wa:convos:${phoneNumberId}:${today}`;

    const newCount = await this.redis.incrby(key, count);

    // Set TTL to expire at end of day (48h buffer)
    const ttl = await this.redis.ttl(key);
    if (ttl < 0) {
      await this.redis.expire(key, 172800); // 48 hours
    }

    return newCount;
  }

  /**
   * Calculate optimal batch size considering all governor dimensions
   */
  async calculateBatchSize(campaign: CampaignEntity): Promise<number> {
    const phoneNumberId = campaign.settings.phoneNumberId;
    if (!phoneNumberId) return 0;

    const remaining = await this.getConversationsRemaining(
      campaign.tenantId,
      phoneNumberId,
    );

    const targetCount = campaign.settings.targetCount ?? remaining;
    const segmentRemaining = Math.max(
      0,
      targetCount - (campaign.stats.sent + campaign.stats.failed),
    );

    let batchSize = Math.min(remaining, segmentRemaining, 500); // cap at 500 per batch

    // Check quality — reduce if YELLOW
    const quality = await this.checkQualityRating(
      campaign.tenantId,
      phoneNumberId,
    );
    if (quality === QualityRating.YELLOW) {
      batchSize = Math.ceil(batchSize * 0.5);
      this.logger.warn(
        `Quality YELLOW for ${phoneNumberId}, reducing batch to ${batchSize}`,
      );
    }

    return batchSize;
  }

  /**
   * Master decision: should the campaign proceed with sending?
   */
  async shouldProceed(
    tenantId: string,
    phoneNumberId: string,
  ): Promise<GovernorDecision> {
    // Dimension 3: Quality rating
    const quality = await this.checkQualityRating(tenantId, phoneNumberId);

    if (quality === QualityRating.RED) {
      return {
        proceed: false,
        reason: `Quality rating RED for phone ${phoneNumberId}. Sending blocked.`,
      };
    }

    // Dimension 1: Messaging limits
    const remaining = await this.getConversationsRemaining(
      tenantId,
      phoneNumberId,
    );
    if (remaining <= 0) {
      return {
        proceed: false,
        reason: `Daily conversation limit reached for phone ${phoneNumberId}.`,
      };
    }

    if (quality === QualityRating.YELLOW) {
      return {
        proceed: true,
        reducePacing: true,
        reason: `Quality YELLOW — reducing pacing by 50%.`,
      };
    }

    return { proceed: true };
  }
}
