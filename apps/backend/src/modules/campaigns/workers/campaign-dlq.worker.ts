import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectRedis } from '../../../common/redis/inject-redis.decorator';
import Redis from 'ioredis';
import { CampaignMessageEntity, CampaignMessageStatus } from '../entities/campaign-message.entity';
import { CampaignEntity } from '../entities/campaign.entity';

interface DlqJobData {
  tenantId: string;
  campaignId: string;
  campaignMessageId: string;
  contactId: string;
  error?: string;
  failedAt?: string;
}

@Processor('campaign_dlq', {
  concurrency: 5,
})
export class CampaignDlqWorker extends WorkerHost {
  private readonly logger = new Logger(CampaignDlqWorker.name);

  constructor(
    private readonly em: EntityManager,
    @InjectRedis() private readonly redis: Redis,
  ) {
    super();
  }

  async process(job: Job<DlqJobData>): Promise<void> {
    const { tenantId, campaignId, campaignMessageId, contactId, error } =
      job.data;

    this.logger.warn(
      `DLQ processing: campaign=${campaignId}, message=${campaignMessageId}, contact=${contactId}, error=${error}`,
    );

    const fork = this.em.fork();

    // Update message status to failed
    const message = await fork.findOne(CampaignMessageEntity, {
      id: campaignMessageId,
      tenantId,
    });

    if (message && message.status !== CampaignMessageStatus.FAILED) {
      message.status = CampaignMessageStatus.FAILED;
      message.errorCode = (error ?? 'DLQ_EXHAUSTED_RETRIES').substring(0, 100);
      await fork.flush();
    }

    // Increment failed counter in Redis
    const statsKey = `campaign:stats:${campaignId}`;
    await this.redis.hincrby(statsKey, 'failed', 1);
    await this.redis.expire(statsKey, 86400);

    // Flush stats to campaign entity
    const stats = await this.redis.hgetall(statsKey);
    if (stats && Object.keys(stats).length > 0) {
      const campaign = await fork.findOne(CampaignEntity, {
        id: campaignId,
        tenantId,
      });

      if (campaign) {
        campaign.stats = {
          sent: parseInt(stats.sent || '0', 10),
          delivered: parseInt(stats.delivered || '0', 10),
          read: parseInt(stats.read || '0', 10),
          failed: parseInt(stats.failed || '0', 10),
          optedOut: parseInt(stats.optedOut || '0', 10),
        };
        await fork.flush();
      }
    }

    this.logger.log(
      `DLQ processed: campaign=${campaignId}, message=${campaignMessageId}`,
    );
  }
}
