import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { SubscriptionEntity, SubscriptionStatus } from './entities/subscription.entity';
import { UsageRecordEntity } from './entities/usage-record.entity';
import { PlanService } from './plan.service';
import { TenantEntity } from '../tenant/tenant.entity';

export interface QuotaCheck {
  allowed: boolean;
  current: number;
  limit: number;
}

export interface UsageSummary {
  period: { from: string; to: string };
  metrics: { metric: string; value: number; limit: number }[];
}

const METRIC_TO_LIMIT_KEY: Record<string, string> = {
  messages_sent: 'maxConversations',
  conversations: 'maxConversations',
  ai_queries: 'maxAiQueries',
  storage_mb: 'maxStorageMb',
  contacts: 'maxContacts',
  campaigns: 'maxCampaignsPerMonth',
};

const DEFAULT_TRIAL_PLAN_ID = 'plan_starter';
const TRIAL_DURATION_DAYS = 14;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly planService: PlanService,
  ) {}

  async getSubscription(tenantId: string): Promise<{
    subscription: SubscriptionEntity;
    plan: ReturnType<PlanService['getPlanById']>;
  }> {
    const subscription = await this.ensureSubscription(tenantId);

    const plan = this.planService.getPlanById(subscription.planId);

    return { subscription, plan };
  }

  async checkQuota(tenantId: string, metric: string): Promise<QuotaCheck> {
    const subscription = await this.getBillableSubscription(tenantId);
    const plan = this.planService.getPlanById(subscription.planId);

    const limitKey = METRIC_TO_LIMIT_KEY[metric];
    const limit = limitKey
      ? (plan.limits as unknown as Record<string, unknown>)[limitKey] as number
      : -1;

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, current: 0, limit: -1 };
    }

    const current = await this.getCurrentUsage(
      tenantId,
      metric,
      subscription.currentPeriodStart,
      subscription.currentPeriodEnd,
    );

    return {
      allowed: current < limit,
      current,
      limit,
    };
  }

  async incrementUsage(
    tenantId: string,
    metric: string,
    amount: number = 1,
  ): Promise<void> {
    const subscription = await this.getBillableSubscription(tenantId);

    // Find or create usage record for current period
    let record = await this.em.findOne(UsageRecordEntity, {
      tenantId,
      metric,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
    });

    if (record) {
      record.value += amount;
    } else {
      record = this.em.create(UsageRecordEntity, {
        tenantId,
        metric,
        value: amount,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
      } as any);
      this.em.persist(record);
    }

    await this.em.flush();
  }

  async getUsageSummary(
    tenantId: string,
    period?: { from: string; to: string },
  ): Promise<UsageSummary> {
    const { subscription, plan } = await this.getSubscription(tenantId);

    const periodStart = period?.from
      ? new Date(period.from)
      : subscription.currentPeriodStart;
    const periodEnd = period?.to
      ? new Date(period.to)
      : subscription.currentPeriodEnd;

    const records = await this.em.find(UsageRecordEntity, {
      tenantId,
      periodStart: { $gte: periodStart },
      periodEnd: { $lte: periodEnd },
    });

    // Aggregate by metric
    const metricsMap = new Map<string, number>();
    for (const record of records) {
      const existing = metricsMap.get(record.metric) ?? 0;
      metricsMap.set(record.metric, existing + record.value);
    }

    const metrics = Array.from(metricsMap.entries()).map(([metric, value]) => {
      const limitKey = METRIC_TO_LIMIT_KEY[metric];
      const limit = limitKey
        ? (plan.limits as unknown as Record<string, unknown>)[limitKey] as number
        : -1;
      return { metric, value, limit };
    });

    return {
      period: {
        from: periodStart.toISOString(),
        to: periodEnd.toISOString(),
      },
      metrics,
    };
  }

  async canPerformAction(
    tenantId: string,
    action: string,
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const subscription = await this.getBillableSubscription(tenantId);
      const plan = this.planService.getPlanById(subscription.planId);

      // Check feature access
      const actionToFeature: Record<string, string> = {
        send_campaign: 'campaigns',
        use_ai: 'ai_assistant',
        create_schedule: 'scheduling',
        use_kanban: 'kanban',
        manage_team: 'team_management',
        api_access: 'api_access',
      };

      const requiredFeature = actionToFeature[action];
      if (requiredFeature && !plan.limits.features.includes(requiredFeature)) {
        return {
          allowed: false,
          reason: `Feature "${requiredFeature}" is not included in your ${plan.name} plan`,
        };
      }

      // Check quota for metric-based actions
      const actionToMetric: Record<string, string> = {
        send_message: 'messages_sent',
        create_contact: 'contacts',
        send_campaign: 'campaigns',
        ai_query: 'ai_queries',
      };

      const metric = actionToMetric[action];
      if (metric) {
        const quota = await this.checkQuota(tenantId, metric);
        if (!quota.allowed) {
          return {
            allowed: false,
            reason: `Quota exceeded for ${metric}: ${quota.current}/${quota.limit}`,
          };
        }
      }

      if (subscription.status === SubscriptionStatus.PAST_DUE) {
        return {
          allowed: false,
          reason: 'Subscription is past due. Please update your billing information.',
        };
      }

      return { allowed: true };
    } catch {
      return { allowed: false, reason: 'No active subscription' };
    }
  }

  async recordPaymentFailure(tenantId: string): Promise<void> {
    this.logger.warn(`Tenant ${tenantId} entered dunning flow after a payment failure`);
  }

  private async ensureSubscription(tenantId: string): Promise<SubscriptionEntity> {
    const existing = await this.em.findOne(
      SubscriptionEntity,
      { tenantId },
      { orderBy: { createdAt: 'DESC' } },
    );

    if (existing) {
      return existing;
    }

    const tenant = await this.em.findOne(TenantEntity, { id: tenantId });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
    const planId = tenant.planId || DEFAULT_TRIAL_PLAN_ID;

    const subscription = this.em.create(SubscriptionEntity, {
      tenantId,
      planId,
      status: SubscriptionStatus.TRIALING,
      currentPeriodStart: now,
      currentPeriodEnd: trialEndsAt,
      trialEndsAt,
      cancelAtPeriodEnd: false,
    } as any);

    tenant.planId = planId;
    tenant.status = 'trial';

    this.em.persist(subscription);
    await this.em.flush();

    return subscription;
  }

  private async getBillableSubscription(tenantId: string): Promise<SubscriptionEntity> {
    const subscription = await this.ensureSubscription(tenantId);

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new NotFoundException('No active subscription found');
    }

    return subscription;
  }

  private async getCurrentUsage(
    tenantId: string,
    metric: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<number> {
    const records = await this.em.find(UsageRecordEntity, {
      tenantId,
      metric,
      periodStart: { $gte: periodStart },
      periodEnd: { $lte: periodEnd },
    });

    return records.reduce((sum, r) => sum + r.value, 0);
  }
}
