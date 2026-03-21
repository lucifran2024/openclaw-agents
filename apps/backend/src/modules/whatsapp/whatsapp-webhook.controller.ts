import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  Logger,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EntityManager } from '@mikro-orm/core';
import { Request, Response } from 'express';
import { WhatsAppCloudAdapter } from './whatsapp-cloud.adapter';
import { WebhookEventEntity } from './webhook-event.entity';
import { WhatsAppAccountEntity } from './whatsapp-account.entity';
import { ulid } from 'ulid';

@Controller('whatsapp/webhook')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly cloudAdapter: WhatsAppCloudAdapter,
    @InjectQueue('whatsapp_webhook') private readonly webhookQueue: Queue,
    private readonly em: EntityManager,
  ) {}

  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expectedToken = this.configService.get<string>('whatsapp.webhookVerifyToken');

    if (mode === 'subscribe' && verifyToken === expectedToken) {
      this.logger.log('Webhook verification successful');
      return res.status(HttpStatus.OK).send(challenge);
    }

    this.logger.warn('Webhook verification failed');
    return res.status(HttpStatus.FORBIDDEN).send('Verification failed');
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['x-hub-signature-256'] as string;
    const rawBody = req.rawBody;

    if (!rawBody || !signature) {
      this.logger.warn('Missing raw body or signature');
      return { status: 'error', message: 'Missing signature' };
    }

    const appSecret = this.configService.get<string>('whatsapp.appSecret');
    const isValid = this.cloudAdapter.verifyWebhookSignature(
      rawBody.toString('utf-8'),
      signature,
      appSecret!,
    );

    if (!isValid) {
      this.logger.warn('Invalid webhook signature');
      return { status: 'error', message: 'Invalid signature' };
    }

    const payload = JSON.parse(rawBody.toString('utf-8'));

    try {
      await this.processWebhookPayload(payload);
    } catch (error) {
      this.logger.error(`Webhook processing error: ${(error as Error).message}`);
    }

    return { status: 'ok' };
  }

  private async processWebhookPayload(payload: Record<string, unknown>) {
    const entries = (payload.entry as any[]) || [];

    for (const entry of entries) {
      const changes = (entry.changes as any[]) || [];

      for (const change of changes) {
        const value = change.value || {};
        const field = change.field;

        let eventType: string;
        if (value.messages) {
          eventType = 'messages';
        } else if (value.statuses) {
          eventType = 'statuses';
        } else if (field === 'account_update') {
          eventType = 'account_update';
        } else {
          eventType = field || 'unknown';
        }

        const phoneNumberId = value.metadata?.phone_number_id || '';
        const idempotencyKey = `${entry.id}:${change.field}:${Date.now()}:${ulid()}`;

        // Resolve tenant from phone number ID (stored in whatsapp_accounts)
        const tenantId = await this.resolveTenantId(phoneNumberId);

        const fork = this.em.fork();
        const event = fork.create(WebhookEventEntity, {
          tenantId: tenantId || 'unknown',
          eventType,
          payload: value,
          processed: false,
          idempotencyKey,
        } as any);

        await fork.persistAndFlush(event);

        await this.webhookQueue.add(eventType, {
          eventId: event.id,
          tenantId: tenantId || 'unknown',
          eventType,
          payload: value,
        });

        this.logger.debug(`Enqueued webhook event: ${eventType} (${event.id})`);
      }
    }
  }

  private async resolveTenantId(phoneNumberId: string): Promise<string | null> {
    if (!phoneNumberId) return null;

    try {
      const fork = this.em.fork();
      const result = await fork.findOne(
        WhatsAppAccountEntity,
        { phoneNumberId } as any,
        { fields: ['tenantId'] },
      );
      return result?.tenantId || null;
    } catch {
      return null;
    }
  }
}
