import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CampaignEntity, CampaignStatus, CampaignType } from './entities/campaign.entity';
import { CampaignMessageEntity, CampaignMessageStatus } from './entities/campaign-message.entity';
import { WhatsAppTemplateEntity, TemplateCategory, TemplateStatus } from '../whatsapp/whatsapp-template.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

export interface CampaignFilters {
  status?: CampaignStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private readonly em: EntityManager,
    @InjectQueue('campaign_dispatch') private readonly dispatchQueue: Queue,
  ) {}

  async createCampaign(
    tenantId: string,
    userId: string,
    dto: CreateCampaignDto,
  ): Promise<CampaignEntity> {
    const campaign = this.em.create(CampaignEntity, {
      tenantId,
      name: dto.name,
      description: dto.description,
      templateId: dto.templateId,
      segmentId: dto.segmentId,
      type: dto.type ?? CampaignType.BROADCAST,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      settings: dto.settings ?? {},
      status: CampaignStatus.DRAFT,
      createdBy: userId,
      stats: { sent: 0, delivered: 0, read: 0, failed: 0, optedOut: 0 },
    } as any);

    await this.em.persistAndFlush(campaign);
    this.logger.log(`Campaign created: ${campaign.id} by user ${userId}`);
    return campaign;
  }

  async updateCampaign(
    tenantId: string,
    id: string,
    dto: UpdateCampaignDto,
  ): Promise<CampaignEntity> {
    const campaign = await this.em.findOne(CampaignEntity, { id, tenantId });
    if (!campaign) throw new NotFoundException('Campaign not found');

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Only draft campaigns can be updated');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.templateId !== undefined) updateData.templateId = dto.templateId;
    if (dto.segmentId !== undefined) updateData.segmentId = dto.segmentId;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.scheduledAt !== undefined) updateData.scheduledAt = new Date(dto.scheduledAt);
    if (dto.settings !== undefined) updateData.settings = dto.settings;

    this.em.assign(campaign, updateData);
    await this.em.flush();
    return campaign;
  }

  async getCampaigns(
    tenantId: string,
    filters: CampaignFilters = {},
  ): Promise<{ data: CampaignEntity[]; total: number }> {
    const { status, page = 1, limit = 20 } = filters;

    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;

    const [data, total] = await this.em.findAndCount(CampaignEntity, where, {
      orderBy: { createdAt: 'DESC' },
      limit,
      offset: (page - 1) * limit,
    });

    return { data, total };
  }

  async getCampaignById(
    tenantId: string,
    id: string,
  ): Promise<CampaignEntity> {
    const campaign = await this.em.findOne(CampaignEntity, { id, tenantId });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async startCampaign(
    tenantId: string,
    id: string,
  ): Promise<CampaignEntity> {
    const campaign = await this.getCampaignById(tenantId, id);

    if (
      campaign.status !== CampaignStatus.DRAFT &&
      campaign.status !== CampaignStatus.SCHEDULED
    ) {
      throw new BadRequestException(
        `Campaign cannot be started from status: ${campaign.status}`,
      );
    }

    // Validate template: must be approved + marketing category
    await this.validateTemplate(tenantId, campaign.templateId);

    // Validate phone number ID is set
    if (!campaign.settings.phoneNumberId) {
      throw new BadRequestException(
        'Campaign settings must include phoneNumberId',
      );
    }

    campaign.status = CampaignStatus.RUNNING;
    campaign.startedAt = new Date();
    await this.em.flush();

    // Enqueue for dispatch
    await this.dispatchQueue.add(
      'dispatch-campaign',
      {
        tenantId,
        campaignId: campaign.id,
      },
      {
        jobId: `campaign:${campaign.id}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    this.logger.log(`Campaign ${campaign.id} started and queued for dispatch`);
    return campaign;
  }

  async pauseCampaign(
    tenantId: string,
    id: string,
  ): Promise<CampaignEntity> {
    const campaign = await this.getCampaignById(tenantId, id);

    if (campaign.status !== CampaignStatus.RUNNING) {
      throw new BadRequestException('Only running campaigns can be paused');
    }

    campaign.status = CampaignStatus.PAUSED;
    await this.em.flush();

    this.logger.log(`Campaign ${campaign.id} paused`);
    return campaign;
  }

  async cancelCampaign(
    tenantId: string,
    id: string,
  ): Promise<CampaignEntity> {
    const campaign = await this.getCampaignById(tenantId, id);

    if (
      campaign.status === CampaignStatus.COMPLETED ||
      campaign.status === CampaignStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Campaign cannot be cancelled from status: ${campaign.status}`,
      );
    }

    campaign.status = CampaignStatus.CANCELLED;
    campaign.completedAt = new Date();
    await this.em.flush();

    this.logger.log(`Campaign ${campaign.id} cancelled`);
    return campaign;
  }

  async getCampaignStats(
    tenantId: string,
    id: string,
  ): Promise<CampaignEntity['stats'] & { pending: number; total: number }> {
    const campaign = await this.getCampaignById(tenantId, id);

    // Get real-time counts from campaign_messages for accuracy
    const qb = this.em.createQueryBuilder(CampaignMessageEntity, 'cm');
    const statusCounts = await qb
      .select(['cm.status', 'count(*) as count'])
      .where({ tenantId, campaignId: id })
      .groupBy('cm.status')
      .execute<{ status: string; count: string }[]>();

    const counts: Record<string, number> = {};
    for (const row of statusCounts) {
      counts[row.status] = parseInt(row.count, 10);
    }

    return {
      sent: counts[CampaignMessageStatus.SENT] ?? campaign.stats.sent,
      delivered: counts[CampaignMessageStatus.DELIVERED] ?? campaign.stats.delivered,
      read: counts[CampaignMessageStatus.READ] ?? campaign.stats.read,
      failed: counts[CampaignMessageStatus.FAILED] ?? campaign.stats.failed,
      optedOut: counts[CampaignMessageStatus.OPTED_OUT] ?? campaign.stats.optedOut,
      pending: counts[CampaignMessageStatus.PENDING] ?? 0,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
    };
  }

  async getCampaignMessages(
    tenantId: string,
    campaignId: string,
    filters: { status?: CampaignMessageStatus; page?: number; limit?: number } = {},
  ): Promise<{ data: CampaignMessageEntity[]; total: number }> {
    const { status, page = 1, limit = 20 } = filters;

    const where: Record<string, unknown> = { tenantId, campaignId };
    if (status) where.status = status;

    const [data, total] = await this.em.findAndCount(
      CampaignMessageEntity,
      where,
      {
        orderBy: { createdAt: 'DESC' },
        limit,
        offset: (page - 1) * limit,
      },
    );

    return { data, total };
  }

  private async validateTemplate(
    tenantId: string,
    templateId: string,
  ): Promise<void> {
    const template = await this.em.findOne(WhatsAppTemplateEntity, {
      id: templateId,
      tenantId,
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.status !== TemplateStatus.APPROVED) {
      throw new BadRequestException(
        `Template must be approved. Current status: ${template.status}`,
      );
    }

    if (template.category !== TemplateCategory.MARKETING) {
      throw new BadRequestException(
        `Only marketing templates can be used in campaigns. Template category: ${template.category}`,
      );
    }
  }
}
