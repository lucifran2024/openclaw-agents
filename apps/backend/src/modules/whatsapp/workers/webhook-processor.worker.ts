import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Job } from 'bullmq';
import { WebhookEventEntity } from '../webhook-event.entity';
import { QualityMonitorService } from '../quality-monitor.service';
import { WindowTrackerService } from '../window-tracker.service';
import { QualityRating, WhatsAppAccountEntity, WhatsAppProvider, AccountStatus } from '../whatsapp-account.entity';
import { ConversationService } from '../../inbox/conversation.service';
import { MessageService } from '../../inbox/message.service';
import { ContactService } from '../../contacts/contact.service';
import { ConversationChannel } from '../../inbox/conversation.entity';
import { MessageSenderType, MessageContentType, MessageStatus } from '../../inbox/message.entity';

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
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly contactService: ContactService,
  ) {
    super();
  }

  async process(job: Job<WebhookJobData>): Promise<void> {
    const { eventId, tenantId, eventType, payload } = job.data;

    this.logger.debug(`Processing webhook event: ${eventType} (${eventId})`);

    try {
      switch (eventType) {
        // Meta Cloud API events
        case 'messages':
          await this.handleMetaMessages(tenantId, payload);
          break;
        case 'statuses':
          await this.handleMetaStatuses(tenantId, payload);
          break;
        case 'account_update':
          await this.handleAccountUpdate(tenantId, payload);
          break;

        // Evolution API events
        case 'evolution_messages':
          await this.handleEvolutionMessages(tenantId, payload);
          break;
        case 'evolution_statuses':
          await this.handleEvolutionStatuses(tenantId, payload);
          break;
        case 'evolution_connection':
          await this.handleEvolutionConnection(tenantId, payload);
          break;
        case 'evolution_qrcode':
          // QR code events are handled by the frontend polling - no action needed
          this.logger.debug(`QR code event for tenant ${tenantId}`);
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

  // ─── Meta Cloud API handlers ───────────────────────────────

  private async handleMetaMessages(tenantId: string, payload: Record<string, unknown>) {
    const messages = (payload.messages as any[]) || [];
    const metadata = payload.metadata as any;
    const phoneNumberId = metadata?.phone_number_id;

    for (const message of messages) {
      const channelId = `${phoneNumberId}:${message.from}`;

      this.windowTracker.updateWindow(channelId, new Date(Number(message.timestamp) * 1000));

      await this.upsertConversationAndMessage(tenantId, {
        channelId,
        contactPhone: message.from,
        messageType: message.type,
        messageContent: this.extractMetaMessageContent(message),
        externalId: message.id,
        timestamp: new Date(Number(message.timestamp) * 1000),
      });
    }
  }

  private async handleMetaStatuses(tenantId: string, payload: Record<string, unknown>) {
    const statuses = (payload.statuses as any[]) || [];

    for (const status of statuses) {
      const statusMap: Record<string, MessageStatus> = {
        sent: MessageStatus.SENT,
        delivered: MessageStatus.DELIVERED,
        read: MessageStatus.READ,
        failed: MessageStatus.FAILED,
      };

      const mappedStatus = statusMap[status.status];
      if (mappedStatus && status.id) {
        await this.messageService.updateStatusByExternalId(tenantId, status.id, mappedStatus);
      }
    }
  }

  // ─── Evolution API handlers ────────────────────────────────

  private async handleEvolutionMessages(tenantId: string, payload: Record<string, unknown>) {
    const data = payload.data as any;
    const instanceName = payload.instanceName as string;

    if (!data) return;

    // Evolution v2 sends messages in data array or single object
    const messages = Array.isArray(data) ? data : [data];

    for (const msg of messages) {
      const key = msg.key || {};
      const fromMe = key.fromMe || false;
      const remoteJid = key.remoteJid || '';
      const messageId = key.id || '';

      // Skip messages sent by us (fromMe) - we track those via outbound
      if (fromMe) continue;

      // Extract phone number from JID (format: 5511999999999@s.whatsapp.net)
      const contactPhone = remoteJid.replace(/@.*$/, '');
      const channelId = `evo:${instanceName}:${contactPhone}`;

      const { type, content } = this.extractEvolutionMessageContent(msg);

      await this.upsertConversationAndMessage(tenantId, {
        channelId,
        contactPhone,
        messageType: type,
        messageContent: content,
        externalId: messageId,
        timestamp: new Date((msg.messageTimestamp || Date.now() / 1000) * 1000),
      });
    }
  }

  private async handleEvolutionStatuses(tenantId: string, payload: Record<string, unknown>) {
    const data = payload.data as any;
    if (!data) return;

    const updates = Array.isArray(data) ? data : [data];

    for (const update of updates) {
      const key = update.key || {};
      const messageId = key.id;
      const status = update.update?.status;

      if (!messageId || !status) continue;

      // Evolution status codes: 2 = sent, 3 = delivered, 4 = read
      const statusMap: Record<number, MessageStatus> = {
        2: MessageStatus.SENT,
        3: MessageStatus.DELIVERED,
        4: MessageStatus.READ,
      };

      const mappedStatus = statusMap[status];
      if (mappedStatus) {
        await this.messageService.updateStatusByExternalId(tenantId, messageId, mappedStatus);
      }
    }
  }

  private async handleEvolutionConnection(tenantId: string, payload: Record<string, unknown>) {
    const data = payload.data as any;
    const instanceName = payload.instanceName as string;

    if (!data || !instanceName) return;

    const state = data.state || data.status;

    this.logger.log(`Evolution connection update: instance=${instanceName} state=${state} tenant=${tenantId}`);

    // Update account status based on connection state
    if (state === 'open') {
      await this.updateEvolutionAccountStatus(tenantId, instanceName, AccountStatus.ACTIVE);
    } else if (state === 'close') {
      await this.updateEvolutionAccountStatus(tenantId, instanceName, AccountStatus.INACTIVE);
    }
  }

  // ─── Shared helpers ────────────────────────────────────────

  private async upsertConversationAndMessage(
    tenantId: string,
    params: {
      channelId: string;
      contactPhone: string;
      messageType: string;
      messageContent: Record<string, unknown>;
      externalId: string;
      timestamp: Date;
    },
  ) {
    // Find or create contact by phone number
    let contact = await this.contactService.findByPhone(tenantId, params.contactPhone);
    if (!contact) {
      contact = await this.contactService.create(tenantId, {
        name: params.contactPhone,
        phone: params.contactPhone,
        whatsappId: params.contactPhone,
        source: 'whatsapp',
      } as any);
      this.logger.log(`Created contact ${contact.id} for phone ${params.contactPhone}`);
    }

    // Find or create conversation
    let conversation = await this.conversationService.findByChannelId(
      tenantId,
      ConversationChannel.WHATSAPP,
      params.channelId,
    );

    if (!conversation) {
      conversation = await this.conversationService.create(tenantId, {
        contactId: contact.id,
        channel: ConversationChannel.WHATSAPP,
        channelId: params.channelId,
      });
    }

    // Map message type to content type
    const contentTypeMap: Record<string, MessageContentType> = {
      text: MessageContentType.TEXT,
      image: MessageContentType.IMAGE,
      video: MessageContentType.VIDEO,
      audio: MessageContentType.AUDIO,
      document: MessageContentType.DOCUMENT,
      sticker: MessageContentType.STICKER,
      location: MessageContentType.LOCATION,
    };

    const contentType = contentTypeMap[params.messageType] || MessageContentType.TEXT;

    // Create message with idempotency
    await this.messageService.create(tenantId, {
      conversationId: conversation.id,
      senderType: MessageSenderType.CONTACT,
      contentType,
      content: params.messageContent,
      externalId: params.externalId,
      idempotencyKey: `wa:${params.externalId}`,
    });

    // Update conversation metadata
    await this.conversationService.incrementMessageCount(tenantId, conversation.id);
    await this.conversationService.updateLastMessageAt(tenantId, conversation.id, params.timestamp);

    // Update session window
    const sessionExpiry = new Date(params.timestamp.getTime() + 24 * 60 * 60 * 1000);
    await this.conversationService.updateSessionWindow(tenantId, conversation.id, sessionExpiry);
  }

  private extractMetaMessageContent(message: any): Record<string, unknown> {
    switch (message.type) {
      case 'text':
        return { text: message.text?.body || '' };
      case 'image':
        return { url: message.image?.id, caption: message.image?.caption, mimeType: message.image?.mime_type };
      case 'video':
        return { url: message.video?.id, caption: message.video?.caption, mimeType: message.video?.mime_type };
      case 'audio':
        return { url: message.audio?.id, mimeType: message.audio?.mime_type };
      case 'document':
        return { url: message.document?.id, filename: message.document?.filename, mimeType: message.document?.mime_type };
      case 'location':
        return { latitude: message.location?.latitude, longitude: message.location?.longitude };
      case 'sticker':
        return { url: message.sticker?.id, mimeType: message.sticker?.mime_type };
      default:
        return { raw: message };
    }
  }

  private extractEvolutionMessageContent(msg: any): { type: string; content: Record<string, unknown> } {
    const message = msg.message || {};

    if (message.conversation || message.extendedTextMessage) {
      return {
        type: 'text',
        content: { text: message.conversation || message.extendedTextMessage?.text || '' },
      };
    }
    if (message.imageMessage) {
      return {
        type: 'image',
        content: { url: message.imageMessage.url, caption: message.imageMessage.caption, mimeType: message.imageMessage.mimetype },
      };
    }
    if (message.videoMessage) {
      return {
        type: 'video',
        content: { url: message.videoMessage.url, caption: message.videoMessage.caption, mimeType: message.videoMessage.mimetype },
      };
    }
    if (message.audioMessage) {
      return {
        type: 'audio',
        content: { url: message.audioMessage.url, mimeType: message.audioMessage.mimetype },
      };
    }
    if (message.documentMessage) {
      return {
        type: 'document',
        content: { url: message.documentMessage.url, filename: message.documentMessage.fileName, mimeType: message.documentMessage.mimetype },
      };
    }
    if (message.stickerMessage) {
      return {
        type: 'sticker',
        content: { url: message.stickerMessage.url, mimeType: message.stickerMessage.mimetype },
      };
    }
    if (message.locationMessage) {
      return {
        type: 'location',
        content: { latitude: message.locationMessage.degreesLatitude, longitude: message.locationMessage.degreesLongitude },
      };
    }

    return { type: 'text', content: { text: '[Unsupported message type]', raw: message } };
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

  private async updateEvolutionAccountStatus(
    tenantId: string,
    instanceName: string,
    status: AccountStatus,
  ): Promise<void> {
    try {
      const fork = this.em.fork();
      const account = await fork.findOne(WhatsAppAccountEntity, {
        tenantId,
        evolutionInstanceName: instanceName,
        provider: WhatsAppProvider.EVOLUTION,
      } as any);

      if (account) {
        account.status = status;
        await fork.flush();
        this.logger.log(`Updated Evolution account ${instanceName} status to ${status}`);
      }
    } catch (error) {
      this.logger.error(`Failed to update Evolution account status: ${(error as Error).message}`);
    }
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
