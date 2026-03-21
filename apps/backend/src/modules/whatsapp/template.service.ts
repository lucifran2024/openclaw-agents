import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { WhatsAppCloudAdapter } from './whatsapp-cloud.adapter';
import { WhatsAppAccountEntity } from './whatsapp-account.entity';
import { WhatsAppTemplateEntity, TemplateCategory, TemplateStatus } from './whatsapp-template.entity';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly cloudAdapter: WhatsAppCloudAdapter,
  ) {}

  async syncTemplates(tenantId: string, accountId: string): Promise<number> {
    const fork = this.em.fork();

    const account = await fork.findOneOrFail(WhatsAppAccountEntity, {
      id: accountId,
      tenantId,
    });

    const remoteTemplates = await this.cloudAdapter.getTemplates(
      account.wabaId,
      account.accessTokenEncrypted,
    );

    let synced = 0;

    for (const remote of remoteTemplates) {
      const existing = await fork.findOne(WhatsAppTemplateEntity, {
        tenantId,
        whatsappAccountId: accountId,
        metaTemplateId: remote.id,
      });

      if (existing) {
        existing.name = remote.name;
        existing.language = remote.language;
        existing.category = remote.category as TemplateCategory;
        existing.status = remote.status as TemplateStatus;
        existing.components = remote.components;
      } else {
        fork.create(WhatsAppTemplateEntity, {
          tenantId,
          whatsappAccountId: accountId,
          metaTemplateId: remote.id,
          name: remote.name,
          language: remote.language,
          category: remote.category as TemplateCategory,
          status: remote.status as TemplateStatus,
          components: remote.components,
        } as any);
      }

      synced++;
    }

    await fork.flush();
    this.logger.log(`Synced ${synced} templates for account ${accountId}`);
    return synced;
  }

  async findAll(tenantId: string, accountId?: string): Promise<WhatsAppTemplateEntity[]> {
    const fork = this.em.fork();
    const filter: Record<string, unknown> = { tenantId };
    if (accountId) {
      filter.whatsappAccountId = accountId;
    }
    return fork.find(WhatsAppTemplateEntity, filter);
  }

  async findByName(
    tenantId: string,
    name: string,
    language?: string,
  ): Promise<WhatsAppTemplateEntity | null> {
    const fork = this.em.fork();
    const filter: Record<string, unknown> = { tenantId, name };
    if (language) {
      filter.language = language;
    }
    return fork.findOne(WhatsAppTemplateEntity, filter);
  }
}
