import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WhatsAppAccountEntity } from './whatsapp-account.entity';

@Injectable()
export class WhatsAppSenderService {
  private readonly logger = new Logger(WhatsAppSenderService.name);

  constructor(
    private readonly em: EntityManager,
    @InjectQueue('whatsapp_outbound') private readonly outboundQueue: Queue,
  ) {}

  async sendTextMessage(
    tenantId: string,
    phoneNumberId: string,
    to: string,
    text: string,
  ) {
    const account = await this.getAccount(tenantId, phoneNumberId);

    const job = await this.outboundQueue.add('send-message', {
      tenantId,
      phoneNumberId: account.phoneNumberId,
      accessToken: account.accessTokenEncrypted,
      to,
      type: 'text',
      content: { text },
    });

    this.logger.debug(`Text message queued: job ${job.id} to ${to}`);
    return { jobId: job.id, queued: true };
  }

  async sendTemplateMessage(
    tenantId: string,
    phoneNumberId: string,
    to: string,
    templateName: string,
    language: string = 'pt_BR',
    components: Record<string, unknown>[] = [],
  ) {
    const account = await this.getAccount(tenantId, phoneNumberId);

    const job = await this.outboundQueue.add('send-message', {
      tenantId,
      phoneNumberId: account.phoneNumberId,
      accessToken: account.accessTokenEncrypted,
      to,
      type: 'template',
      content: { templateName, language, components },
    });

    this.logger.debug(`Template message queued: job ${job.id} to ${to}`);
    return { jobId: job.id, queued: true };
  }

  async sendMediaMessage(
    tenantId: string,
    phoneNumberId: string,
    to: string,
    type: 'image' | 'video' | 'audio' | 'document',
    url: string,
    caption?: string,
  ) {
    const account = await this.getAccount(tenantId, phoneNumberId);

    const job = await this.outboundQueue.add('send-message', {
      tenantId,
      phoneNumberId: account.phoneNumberId,
      accessToken: account.accessTokenEncrypted,
      to,
      type,
      content: { url, caption },
    });

    this.logger.debug(`Media message (${type}) queued: job ${job.id} to ${to}`);
    return { jobId: job.id, queued: true };
  }

  private async getAccount(tenantId: string, phoneNumberId: string): Promise<WhatsAppAccountEntity> {
    const fork = this.em.fork();
    const account = await fork.findOne(WhatsAppAccountEntity, {
      tenantId,
      phoneNumberId,
    });

    if (!account) {
      throw new NotFoundException(
        `WhatsApp account not found for tenant ${tenantId} with phoneNumberId ${phoneNumberId}`,
      );
    }

    if (account.status !== 'active') {
      throw new Error(`WhatsApp account ${phoneNumberId} is not active (status: ${account.status})`);
    }

    return account;
  }
}
