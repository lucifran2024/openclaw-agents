import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectRedis } from '../../../common/redis/inject-redis.decorator';
import Redis from 'ioredis';
import { CampaignMessageEntity, CampaignMessageStatus } from '../entities/campaign-message.entity';
import { CampaignEntity, CampaignStatus } from '../entities/campaign.entity';
import { WhatsAppTemplateEntity } from '../../whatsapp/whatsapp-template.entity';
import { WhatsAppSenderService } from '../../whatsapp/whatsapp-sender.service';
import { CampaignGovernorService } from '../campaign-governor.service';

interface SendJobData {
  tenantId: string;
  campaignId: string;
  campaignMessageId: string;
  contactId: string;
  contactPhone: string;
  phoneNumberId: string;
  idempotencyKey: string;
}

@Processor('campaign_send', {
  concurrency: 10,
  limiter: {
    max: 50,
    duration: 1000, // Dimension 2: Throughput — 50 msgs/sec
  },
})
export class CampaignSenderWorker extends WorkerHost {
  private readonly logger = new Logger(CampaignSenderWorker.name);
  private readonly STATS_FLUSH_INTERVAL = 50; // flush stats every N messages

  constructor(
    private readonly em: EntityManager,
    private readonly whatsappSender: WhatsAppSenderService,
    private readonly governor: CampaignGovernorService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    super();
  }

  async process(job: Job<SendJobData>): Promise<void> {
    const {
      tenantId,
      campaignId,
      campaignMessageId,
      contactPhone,
      phoneNumberId,
      idempotencyKey,
    } = job.data;

    const fork = this.em.fork();

    // Idempotency check via Redis SET
    const idempotencyRedisKey = `campaign:idem:${idempotencyKey}`;
    const alreadySent = await this.redis.set(
      idempotencyRedisKey,
      '1',
      'EX',
      86400 * 3, // 3 day TTL
      'NX',
    );

    if (!alreadySent) {
      this.logger.debug(
        `Message ${campaignMessageId} already sent (idempotency key: ${idempotencyKey})`,
      );
      return;
    }

    const message = await fork.findOne(CampaignMessageEntity, {
      id: campaignMessageId,
      tenantId,
    });

    if (!message) {
      this.logger.error(`Campaign message ${campaignMessageId} not found`);
      return;
    }

    if (message.status !== CampaignMessageStatus.PENDING) {
      this.logger.debug(
        `Message ${campaignMessageId} already processed (status: ${message.status})`,
      );
      return;
    }

    // Check campaign is still running
    const campaign = await fork.findOne(CampaignEntity, {
      id: campaignId,
      tenantId,
    });

    if (!campaign || campaign.status !== CampaignStatus.RUNNING) {
      this.logger.debug(
        `Campaign ${campaignId} not running, skipping message ${campaignMessageId}`,
      );
      return;
    }

    // Load template for sending
    const template = await fork.findOne(WhatsAppTemplateEntity, {
      id: campaign.templateId,
      tenantId,
    });

    if (!template) {
      message.status = CampaignMessageStatus.FAILED;
      message.errorCode = 'TEMPLATE_NOT_FOUND';
      await fork.flush();
      await this.incrementStatCounter(campaignId, 'failed');
      return;
    }

    if (!contactPhone) {
      message.status = CampaignMessageStatus.FAILED;
      message.errorCode = 'NO_PHONE_NUMBER';
      await fork.flush();
      await this.incrementStatCounter(campaignId, 'failed');
      return;
    }

    try {
      // Send via WhatsApp sender service
      const result = await this.whatsappSender.sendTemplateMessage(
        tenantId,
        phoneNumberId,
        contactPhone,
        template.name,
        template.language,
        template.components,
      );

      message.status = CampaignMessageStatus.SENT;
      message.sentAt = new Date();
      message.messageId = result.jobId ?? undefined;
      await fork.flush();

      // Increment conversation count (Dimension 1)
      await this.governor.incrementConversationCount(phoneNumberId);

      // Increment stats counter in Redis
      await this.incrementStatCounter(campaignId, 'sent');

      this.logger.debug(
        `Campaign message ${campaignMessageId} sent successfully`,
      );
    } catch (error: any) {
      message.status = CampaignMessageStatus.FAILED;
      message.errorCode = error.message?.substring(0, 100) ?? 'UNKNOWN_ERROR';
      await fork.flush();

      await this.incrementStatCounter(campaignId, 'failed');

      this.logger.error(
        `Failed to send campaign message ${campaignMessageId}: ${error.message}`,
      );

      // Re-throw to trigger BullMQ retry/DLQ
      throw error;
    }
  }

  /**
   * Increment campaign stat counters in Redis (flushed periodically to DB)
   */
  private async incrementStatCounter(
    campaignId: string,
    field: 'sent' | 'delivered' | 'read' | 'failed' | 'optedOut',
  ): Promise<void> {
    const statsKey = `campaign:stats:${campaignId}`;
    const count = await this.redis.hincrby(statsKey, field, 1);
    await this.redis.expire(statsKey, 86400); // 24h TTL

    // Periodically flush stats to DB
    if (count % this.STATS_FLUSH_INTERVAL === 0) {
      await this.flushStatsToDB(campaignId, statsKey);
    }
  }

  private async flushStatsToDB(
    campaignId: string,
    statsKey: string,
  ): Promise<void> {
    try {
      const stats = await this.redis.hgetall(statsKey);
      if (!stats || Object.keys(stats).length === 0) return;

      const fork = this.em.fork();
      const campaign = await fork.findOne(CampaignEntity, { id: campaignId });
      if (!campaign) return;

      campaign.stats = {
        sent: parseInt(stats.sent || '0', 10),
        delivered: parseInt(stats.delivered || '0', 10),
        read: parseInt(stats.read || '0', 10),
        failed: parseInt(stats.failed || '0', 10),
        optedOut: parseInt(stats.optedOut || '0', 10),
      };

      await fork.flush();
    } catch (err: any) {
      this.logger.error(`Failed to flush stats for campaign ${campaignId}: ${err.message}`);
    }
  }
}
