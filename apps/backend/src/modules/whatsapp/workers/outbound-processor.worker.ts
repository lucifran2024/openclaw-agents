import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { EntityManager, CreateRequestContext } from '@mikro-orm/core';
import { Job } from 'bullmq';
import { WhatsAppCloudAdapter } from '../whatsapp-cloud.adapter';
import { EvolutionApiAdapter } from '../evolution-api.adapter';
import { WhatsAppAccountEntity, WhatsAppProvider } from '../whatsapp-account.entity';

interface OutboundJobData {
  tenantId: string;
  phoneNumberId: string;
  accessToken: string;
  to: string;
  type: 'text' | 'template' | 'image' | 'video' | 'audio' | 'document' | 'interactive' | 'location' | 'reaction';
  content: Record<string, unknown>;
}

@Processor('whatsapp_outbound')
export class OutboundProcessorWorker extends WorkerHost {
  private readonly logger = new Logger(OutboundProcessorWorker.name);

  constructor(
    private readonly em: EntityManager,
    private readonly cloudAdapter: WhatsAppCloudAdapter,
    private readonly evolutionAdapter: EvolutionApiAdapter,
  ) {
    super();
  }

  @CreateRequestContext()
  async process(job: Job<OutboundJobData>): Promise<void> {
    const { tenantId, phoneNumberId, accessToken, to, type, content } = job.data;

    this.logger.debug(`Processing outbound message: job ${job.id} to ${to} (type: ${type})`);

    try {
      // Determine provider from account
      const account = await this.getAccount(tenantId, phoneNumberId);

      if (account.provider === WhatsAppProvider.EVOLUTION) {
        // Send via Evolution API
        const instanceName = account.evolutionInstanceName;
        if (!instanceName) {
          throw new Error(`Evolution instance name not set for account ${phoneNumberId}`);
        }

        const result = await this.evolutionAdapter.sendMessage(instanceName, '', {
          to,
          type,
          content,
        });

        if (!result.success) {
          throw new Error(`Evolution send failed: ${result.error}`);
        }

        this.logger.debug(`Message sent via Evolution: ${result.messageId}`);
      } else {
        // Send via Meta Cloud API
        const result = await this.cloudAdapter.sendMessage({
          phoneNumberId,
          accessToken,
          to,
          type,
          content,
        });

        if (!result.success) {
          throw new Error(`Meta Cloud API send failed: ${result.error}`);
        }

        this.logger.debug(`Message sent via Meta: ${result.messageId}`);
      }
    } catch (error) {
      this.logger.error(`Outbound message failed: ${(error as Error).message}`);
      throw error; // Triggers BullMQ retry
    }
  }

  private async getAccount(tenantId: string, phoneNumberId: string): Promise<WhatsAppAccountEntity> {
    const fork = this.em.fork();
    const account = await fork.findOne(WhatsAppAccountEntity, {
      tenantId,
      phoneNumberId,
    });

    if (!account) {
      // Try finding by evolutionInstanceName (for Evolution accounts, phoneNumberId may be the instance name)
      const evoAccount = await fork.findOne(WhatsAppAccountEntity, {
        tenantId,
        evolutionInstanceName: phoneNumberId,
      } as any);

      if (evoAccount) return evoAccount;

      throw new Error(`WhatsApp account not found: ${phoneNumberId}`);
    }

    return account;
  }
}
