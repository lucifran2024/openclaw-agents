import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { SlaPolicyEntity } from './sla-policy.entity';
import { ConversationEntity, ConversationPriority } from './conversation.entity';
import { MessageEntity, MessageSenderType } from './message.entity';

export interface SlaViolationResult {
  firstResponseBreached: boolean;
  resolutionBreached: boolean;
  firstResponseRemainingMinutes: number | null;
  resolutionRemainingMinutes: number | null;
}

@Injectable()
export class SlaService {
  constructor(private readonly em: EntityManager) {}

  async findPolicies(tenantId: string): Promise<SlaPolicyEntity[]> {
    return this.em.find(SlaPolicyEntity, { tenantId });
  }

  async createPolicy(
    tenantId: string,
    data: Partial<SlaPolicyEntity>,
  ): Promise<SlaPolicyEntity> {
    const policy = this.em.create(SlaPolicyEntity, {
      ...data,
      tenantId,
    } as any);
    await this.em.persistAndFlush(policy);
    return policy;
  }

  async updatePolicy(
    tenantId: string,
    id: string,
    data: Partial<SlaPolicyEntity>,
  ): Promise<SlaPolicyEntity | null> {
    const policy = await this.em.findOne(SlaPolicyEntity, { tenantId, id });
    if (!policy) return null;

    this.em.assign(policy, data);
    await this.em.flush();
    return policy;
  }

  async deletePolicy(tenantId: string, id: string): Promise<boolean> {
    const policy = await this.em.findOne(SlaPolicyEntity, { tenantId, id });
    if (!policy) return false;

    await this.em.removeAndFlush(policy);
    return true;
  }

  async checkSlaViolation(
    tenantId: string,
    conversationId: string,
  ): Promise<SlaViolationResult | null> {
    const conversation = await this.em.findOne(ConversationEntity, {
      id: conversationId,
      tenantId,
    });
    if (!conversation || !conversation.slaPolicyId) return null;

    const policy = await this.em.findOne(SlaPolicyEntity, {
      id: conversation.slaPolicyId,
      tenantId,
    });
    if (!policy) return null;

    const { firstResponseMinutes, resolutionMinutes } =
      this.getEffectiveSlaLimits(policy, conversation.priority);

    const now = new Date();
    const createdAt = conversation.createdAt;
    const elapsedMinutes =
      (now.getTime() - createdAt.getTime()) / (1000 * 60);

    const firstAgentMessage = await this.em.findOne(
      MessageEntity,
      {
        conversationId,
        tenantId,
        senderType: MessageSenderType.AGENT,
        imported: false,
      },
      { orderBy: { createdAt: 'ASC' } },
    );

    let firstResponseBreached = false;
    let firstResponseRemainingMinutes: number | null = null;

    if (!firstAgentMessage) {
      firstResponseRemainingMinutes = firstResponseMinutes - elapsedMinutes;
      firstResponseBreached = firstResponseRemainingMinutes <= 0;
    }

    const resolutionRemainingMinutes = resolutionMinutes - elapsedMinutes;
    const resolutionBreached = resolutionRemainingMinutes <= 0;

    if (
      (firstResponseBreached || resolutionBreached) &&
      !conversation.slaBreached
    ) {
      conversation.slaBreached = true;
      await this.em.flush();
    }

    return {
      firstResponseBreached,
      resolutionBreached,
      firstResponseRemainingMinutes,
      resolutionRemainingMinutes,
    };
  }

  calculateFirstResponseTime(
    conversation: ConversationEntity,
    firstAgentMessage: MessageEntity,
  ): number {
    const created = conversation.createdAt.getTime();
    const responded = firstAgentMessage.createdAt.getTime();
    return (responded - created) / (1000 * 60);
  }

  private getEffectiveSlaLimits(
    policy: SlaPolicyEntity,
    priority: ConversationPriority,
  ): { firstResponseMinutes: number; resolutionMinutes: number } {
    const override = policy.priorityOverrides[priority];
    if (override) {
      return {
        firstResponseMinutes: override.firstResponse,
        resolutionMinutes: override.resolution,
      };
    }
    return {
      firstResponseMinutes: policy.firstResponseMinutes,
      resolutionMinutes: policy.resolutionMinutes,
    };
  }
}
