import {
  Controller,
  Post,
  Body,
  Logger,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EntityManager } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { WebhookEventEntity } from './webhook-event.entity';
import { WhatsAppAccountEntity, WhatsAppProvider } from './whatsapp-account.entity';
import { ulid } from 'ulid';

/**
 * Receives webhook events from Evolution API.
 * Evolution sends a flat JSON body (not nested like Meta).
 * Typical events: MESSAGES_UPSERT, MESSAGES_UPDATE, CONNECTION_UPDATE, QRCODE_UPDATED
 */
@Controller('whatsapp/evolution-webhook')
export class EvolutionWebhookController {
  private readonly logger = new Logger(EvolutionWebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue('whatsapp_webhook') private readonly webhookQueue: Queue,
    private readonly em: EntityManager,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: Record<string, unknown>,
    @Headers('apikey') apiKey?: string,
  ) {
    // Optional: validate API key from Evolution
    const expectedKey = this.configService.get<string>('EVOLUTION_API_KEY');
    if (expectedKey && apiKey && apiKey !== expectedKey) {
      this.logger.warn('Invalid Evolution webhook API key');
      return { status: 'error', message: 'Invalid API key' };
    }

    const event = (body.event as string) || 'unknown';
    const instanceName = (body.instance as string) || '';
    const data = (body.data as Record<string, unknown>) || body;

    this.logger.debug(`Evolution webhook: ${event} from instance ${instanceName}`);

    try {
      // Resolve tenant from instance name
      const tenantId = await this.resolveTenantId(instanceName);

      if (!tenantId) {
        this.logger.warn(`No tenant found for Evolution instance: ${instanceName}`);
        return { status: 'ok', message: 'Instance not registered' };
      }

      // Map Evolution event types to our internal types
      let internalEventType: string;
      switch (event) {
        case 'MESSAGES_UPSERT':
        case 'messages.upsert':
          internalEventType = 'evolution_messages';
          break;
        case 'MESSAGES_UPDATE':
        case 'messages.update':
          internalEventType = 'evolution_statuses';
          break;
        case 'CONNECTION_UPDATE':
        case 'connection.update':
          internalEventType = 'evolution_connection';
          break;
        case 'QRCODE_UPDATED':
        case 'qrcode.updated':
          internalEventType = 'evolution_qrcode';
          break;
        default:
          internalEventType = `evolution_${event.toLowerCase()}`;
      }

      const idempotencyKey = `evo:${instanceName}:${event}:${ulid()}`;

      const fork = this.em.fork();
      const webhookEvent = fork.create(WebhookEventEntity, {
        tenantId,
        eventType: internalEventType,
        payload: { instanceName, event, data },
        processed: false,
        idempotencyKey,
      } as any);

      await fork.persistAndFlush(webhookEvent);

      await this.webhookQueue.add(internalEventType, {
        eventId: webhookEvent.id,
        tenantId,
        eventType: internalEventType,
        payload: { instanceName, event, data },
      });

      this.logger.debug(`Enqueued Evolution event: ${internalEventType} (${webhookEvent.id})`);
    } catch (error) {
      this.logger.error(`Evolution webhook error: ${(error as Error).message}`);
    }

    return { status: 'ok' };
  }

  private async resolveTenantId(instanceName: string): Promise<string | null> {
    if (!instanceName) return null;

    try {
      const fork = this.em.fork();
      const result = await fork.findOne(
        WhatsAppAccountEntity,
        { evolutionInstanceName: instanceName, provider: WhatsAppProvider.EVOLUTION } as any,
        { fields: ['tenantId'] },
      );
      return result?.tenantId || null;
    } catch {
      return null;
    }
  }
}
