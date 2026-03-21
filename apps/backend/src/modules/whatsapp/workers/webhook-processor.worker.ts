import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Job } from 'bullmq';
import { WebhookEventEntity } from '../webhook-event.entity';
import { QualityMonitorService } from '../quality-monitor.service';
import { WindowTrackerService } from '../window-tracker.service';
import { QualityRating } from '../whatsapp-account.entity';

interface WebhookJobData {
  eventId: string;
  tenantId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

@Processor('whatsapp_webhook')
export class WebhookProcessorWorker extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessorWorker.name);

  constructor(
    private readonly em: EntityManager,
    private readonly qualityMonitor: QualityMonitorService,
    private readonly windowTracker: WindowTrackerService,
  ) {
    super();
  }

  async process(job: Job<WebhookJobData>): Promise<void> {
    const { eventId, tenantId, eventType, payload } = job.data;

    this.logger.debug(`Processing webhook event: ${eventType} (${eventId})`);

    try {
      switch (eventType) {
        case 'messages':
          await this.handleMessages(tenantId, payload);
          break;
        case 'statuses':
          await this.handleStatuses(tenantId, payload);
          break;
        case 'account_update':
          await this.handleAccountUpdate(tenantId, payload);
          break;
        default:
          this.logger.warn(`Unknown event type: ${eventType}`);
      }

      await this.markEventProcessed(eventId);
    } catch (error) {
      this.logger.error(
        `Failed to process webhook event ${eventId}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  private async handleMessages(tenantId: string, payload: Record<string, unknown>) {
    const messages = (payload.messages as any[]) || [];
    const metadata = payload.metadata as any;
    const phoneNumberId = metadata?.phone_number_id;

    for (const message of messages) {
      const conversationId = `${phoneNumberId}:${message.from}`;

      // Update the 24h session window based on incoming user message
      this.windowTracker.updateWindow(conversationId, new Date(Number(message.timestamp) * 1000));

      this.logger.debug(
        `Incoming message from ${message.from} (type: ${message.type}) for tenant ${tenantId}`,
      );

      // TODO: Create/update conversation and message in inbox module
      // This will be wired up when the inbox module is implemented
    }
  }

  private async handleStatuses(tenantId: string, payload: Record<string, unknown>) {
    const statuses = (payload.statuses as any[]) || [];

    for (const status of statuses) {
      this.logger.debug(
        `Message status update: ${status.id} -> ${status.status} for tenant ${tenantId}`,
      );

      // TODO: Update message delivery/read status in inbox module
      // Status values: sent, delivered, read, failed
    }
  }

  private async handleAccountUpdate(tenantId: string, payload: Record<string, unknown>) {
    const phoneNumberId = (payload as any).metadata?.phone_number_id;
    const currentLimit = (payload as any).current_limit;
    const event = (payload as any).event;

    if (event === 'PHONE_NUMBER_QUALITY_UPDATE' && phoneNumberId) {
      const qualityMap: Record<string, QualityRating> = {
        GREEN: QualityRating.GREEN,
        YELLOW: QualityRating.YELLOW,
        RED: QualityRating.RED,
      };

      const newQuality = qualityMap[(payload as any).quality_rating];
      if (newQuality) {
        await this.qualityMonitor.updateQuality(tenantId, phoneNumberId, newQuality);
      }
    }

    this.logger.log(
      `Account update for tenant ${tenantId}: event=${event}, limit=${currentLimit}`,
    );
  }

  private async markEventProcessed(eventId: string): Promise<void> {
    const fork = this.em.fork();
    const event = await fork.findOne(WebhookEventEntity, { id: eventId });

    if (event) {
      event.processed = true;
      event.processedAt = new Date();
      await fork.flush();
    }
  }
}
