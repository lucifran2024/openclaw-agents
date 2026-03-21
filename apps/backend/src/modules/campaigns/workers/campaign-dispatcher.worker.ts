import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { EntityManager } from '@mikro-orm/postgresql';
import { ulid } from 'ulid';
import { CampaignEntity, CampaignStatus } from '../entities/campaign.entity';
import { CampaignMessageEntity, CampaignMessageStatus } from '../entities/campaign-message.entity';
import { CampaignGovernorService } from '../campaign-governor.service';
import { SuppressionService } from '../suppression.service';
import { ContactEntity } from '../../contacts/contact.entity';
import { SegmentEntity } from '../../contacts/segment.entity';

interface DispatchJobData {
  tenantId: string;
  campaignId: string;
}

@Processor('campaign_dispatch', {
  concurrency: 2,
})
export class CampaignDispatcherWorker extends WorkerHost {
  private readonly logger = new Logger(CampaignDispatcherWorker.name);

  constructor(
    private readonly em: EntityManager,
    private readonly governor: CampaignGovernorService,
    private readonly suppressionService: SuppressionService,
    @InjectQueue('campaign_send') private readonly sendQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<DispatchJobData>): Promise<void> {
    const { tenantId, campaignId } = job.data;
    const fork = this.em.fork();

    this.logger.log(`Dispatching campaign ${campaignId}`);

    const campaign = await fork.findOne(CampaignEntity, {
      id: campaignId,
      tenantId,
    });

    if (!campaign) {
      this.logger.error(`Campaign ${campaignId} not found`);
      return;
    }

    if (campaign.status !== CampaignStatus.RUNNING) {
      this.logger.warn(
        `Campaign ${campaignId} is not running (status: ${campaign.status}), skipping dispatch`,
      );
      return;
    }

    const phoneNumberId = campaign.settings.phoneNumberId;
    if (!phoneNumberId) {
      this.logger.error(`Campaign ${campaignId} has no phoneNumberId`);
      campaign.status = CampaignStatus.CANCELLED;
      await fork.flush();
      return;
    }

    // Load contacts from segment or all contacts
    const contacts = await this.loadSegmentContacts(fork, tenantId, campaign.segmentId);

    if (contacts.length === 0) {
      this.logger.warn(`Campaign ${campaignId}: no contacts in segment`);
      campaign.status = CampaignStatus.COMPLETED;
      campaign.completedAt = new Date();
      await fork.flush();
      return;
    }

    // Filter out suppressed contacts
    const contactIds = contacts.map((c) => c.id);
    const suppressed = await this.suppressionService.filterSuppressedContacts(
      tenantId,
      contactIds,
    );

    const eligibleContacts = contacts.filter((c) => !suppressed.has(c.id));
    this.logger.log(
      `Campaign ${campaignId}: ${eligibleContacts.length} eligible contacts (${suppressed.size} suppressed)`,
    );

    // Process in batches
    const BATCH_SIZE = 100;
    let offset = 0;

    while (offset < eligibleContacts.length) {
      // Re-check campaign status (may have been paused/cancelled)
      await fork.refresh(campaign);
      if (campaign.status !== CampaignStatus.RUNNING) {
        this.logger.log(
          `Campaign ${campaignId} no longer running (status: ${campaign.status}), stopping dispatch`,
        );
        return;
      }

      // Governor check before each batch
      const decision = await this.governor.shouldProceed(tenantId, phoneNumberId);

      if (!decision.proceed) {
        this.logger.warn(
          `Governor blocked campaign ${campaignId}: ${decision.reason}`,
        );
        campaign.status = CampaignStatus.PAUSED;
        await fork.flush();
        return;
      }

      let currentBatchSize = BATCH_SIZE;
      if (decision.reducePacing) {
        currentBatchSize = Math.ceil(BATCH_SIZE * 0.5);
        this.logger.warn(
          `Governor reducing pacing for campaign ${campaignId}, batch size: ${currentBatchSize}`,
        );
      }

      const batch = eligibleContacts.slice(offset, offset + currentBatchSize);

      // Create campaign_message records and enqueue sends
      const sendJobs: { name: string; data: Record<string, unknown>; opts: Record<string, unknown> }[] = [];

      for (const contact of batch) {
        const idempotencyKey = `${campaignId}:${contact.id}`;

        // Check if message already created (idempotency)
        const existing = await fork.findOne(CampaignMessageEntity, {
          tenantId,
          idempotencyKey,
        });
        if (existing) continue;

        const message = fork.create(CampaignMessageEntity, {
          tenantId,
          campaignId,
          contactId: contact.id,
          status: CampaignMessageStatus.PENDING,
          idempotencyKey,
        } as any);
        fork.persist(message);

        sendJobs.push({
          name: 'send-campaign-message',
          data: {
            tenantId,
            campaignId,
            campaignMessageId: message.id,
            contactId: contact.id,
            contactPhone: contact.phone || contact.whatsappId,
            phoneNumberId,
            idempotencyKey,
          },
          opts: {
            jobId: `campaign-msg:${idempotencyKey}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 3000 },
            removeOnComplete: 100,
            removeOnFail: false, // keep for DLQ
          },
        });
      }

      await fork.flush();

      // Bulk enqueue sends
      if (sendJobs.length > 0) {
        await this.sendQueue.addBulk(sendJobs);
        this.logger.log(
          `Campaign ${campaignId}: enqueued ${sendJobs.length} messages (batch offset ${offset})`,
        );
      }

      offset += currentBatchSize;

      // Update progress
      await job.updateProgress(
        Math.round((offset / eligibleContacts.length) * 100),
      );
    }

    // Update campaign target count
    campaign.settings = {
      ...campaign.settings,
      targetCount: eligibleContacts.length,
    };
    await fork.flush();

    this.logger.log(
      `Campaign ${campaignId}: dispatch complete, ${eligibleContacts.length} messages enqueued`,
    );
  }

  private async loadSegmentContacts(
    em: EntityManager,
    tenantId: string,
    segmentId?: string,
  ): Promise<ContactEntity[]> {
    const where: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
    };

    // If segment specified, we'd apply segment rules here.
    // For now, load all active contacts with a WhatsApp ID or phone.
    if (segmentId) {
      const segment = await em.findOne(SegmentEntity, {
        id: segmentId,
        tenantId,
      });
      if (!segment) {
        this.logger.warn(`Segment ${segmentId} not found`);
        return [];
      }
      // Segment filtering would apply rules from segment.rules
      // For now, we use the segment as a marker and load all contacts
    }

    const contacts = await em.find(
      ContactEntity,
      {
        ...where,
        $or: [
          { phone: { $ne: null } },
          { whatsappId: { $ne: null } },
        ],
      },
      { limit: 50000 }, // safety limit
    );

    return contacts;
  }
}
