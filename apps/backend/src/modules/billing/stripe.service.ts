import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/postgresql';
import Stripe from 'stripe';
import { TenantEntity } from '../tenant/tenant.entity';
import { SubscriptionEntity, SubscriptionStatus } from './entities/subscription.entity';
import {
  StripeWebhookEventEntity,
  StripeWebhookEventStatus,
} from './entities/stripe-webhook-event.entity';
import { BillingService } from './billing.service';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe | null;
  private readonly frontendUrl: string;
  private readonly priceIds: Record<string, string>;

  constructor(
    private readonly configService: ConfigService,
    private readonly em: EntityManager,
    private readonly billingService: BillingService,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey') || '';
    this.frontendUrl =
      this.configService.get<string>('stripe.frontendUrl') || 'http://localhost:3000';
    this.priceIds =
      (this.configService.get<Record<string, string>>('stripe.priceIds') as Record<
        string,
        string
      > | null) || {};

    this.stripe = secretKey ? new Stripe(secretKey) : null;
  }

  async createCustomer(tenantId: string, email?: string) {
    const stripe = this.getStripe();
    const tenant = await this.getTenant(tenantId);

    if (tenant.stripeCustomerId) {
      return stripe.customers.retrieve(tenant.stripeCustomerId);
    }

    const customer = await stripe.customers.create({
      name: tenant.name,
      email,
      metadata: { tenantId, slug: tenant.slug },
    });

    tenant.stripeCustomerId = customer.id;
    await this.em.flush();
    return customer;
  }

  async createCheckoutSession(tenantId: string, planId: string) {
    const stripe = this.getStripe();
    const tenant = await this.getTenant(tenantId);
    const priceId = this.getPriceId(planId);
    const customer = await this.createCustomer(tenantId);
    const subscription = await this.em.findOne(
      SubscriptionEntity,
      { tenantId, status: { $ne: SubscriptionStatus.CANCELLED } },
      { orderBy: { createdAt: 'DESC' } },
    );

    if (subscription?.externalId) {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.externalId);
      const itemId = stripeSubscription.items.data[0]?.id;
      if (!itemId) {
        throw new BadRequestException('Current Stripe subscription item not found');
      }

      await stripe.subscriptions.update(subscription.externalId, {
        cancel_at_period_end: false,
        proration_behavior: 'create_prorations',
        items: [{ id: itemId, price: priceId }],
        metadata: { tenantId, planId },
      });

      await this.syncSubscription(subscription.externalId);
      return {
        mode: 'updated',
        url: null,
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      client_reference_id: tenantId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.frontendUrl}/settings/billing?checkout=success`,
      cancel_url: `${this.frontendUrl}/settings/billing?checkout=cancelled`,
      metadata: { tenantId, planId },
      subscription_data: {
        metadata: { tenantId, planId },
      },
    });

    return {
      mode: 'checkout',
      url: session.url,
      sessionId: session.id,
    };
  }

  async createPortalSession(tenantId: string) {
    const stripe = this.getStripe();
    const tenant = await this.getTenant(tenantId);

    if (!tenant.stripeCustomerId) {
      throw new NotFoundException('Stripe customer not found for this tenant');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${this.frontendUrl}/settings/billing`,
    });

    return { url: session.url };
  }

  async cancelSubscription(tenantId: string) {
    const stripe = this.getStripe();
    const subscription = await this.em.findOne(
      SubscriptionEntity,
      { tenantId, status: { $ne: SubscriptionStatus.CANCELLED } },
      { orderBy: { createdAt: 'DESC' } },
    );

    if (!subscription?.externalId) {
      throw new NotFoundException('No active Stripe subscription found');
    }

    const updated = await stripe.subscriptions.update(subscription.externalId, {
      cancel_at_period_end: true,
    });

    subscription.cancelAtPeriodEnd = Boolean(updated.cancel_at_period_end);
    await this.em.flush();

    return {
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  }

  async listInvoices(tenantId: string) {
    const stripe = this.getStripe();
    const tenant = await this.getTenant(tenantId);

    if (!tenant.stripeCustomerId) {
      return [];
    }

    const invoices = await stripe.invoices.list({
      customer: tenant.stripeCustomerId,
      limit: 20,
    });

    return invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      amountPaid: invoice.amount_paid,
      amountDue: invoice.amount_due,
      currency: invoice.currency,
      status: invoice.status,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      created: invoice.created,
      periodStart: invoice.period_start,
      periodEnd: invoice.period_end,
    }));
  }

  async handleWebhook(payload: Buffer, signature?: string) {
    const stripe = this.getStripe();
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret') || '';

    if (!signature || !webhookSecret) {
      throw new BadRequestException('Missing Stripe webhook signature configuration');
    }

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    const webhookEvent = await this.claimWebhookEvent(event);

    if (!webhookEvent) {
      this.logger.debug(`Skipping duplicate Stripe webhook event ${event.id}`);
      return { received: true, type: event.type, duplicate: true };
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.subscription) {
            await this.syncSubscription(String(session.subscription));
          }
          break;
        }
        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = this.getInvoiceSubscriptionId(invoice);
          if (subscriptionId) {
            await this.syncSubscription(subscriptionId);
          }
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = this.getInvoiceSubscriptionId(invoice);
          if (subscriptionId) {
            await this.markPastDue(subscriptionId);
          }
          break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await this.syncSubscription(subscription.id);
          break;
        }
        default:
          this.logger.debug(`Unhandled Stripe event: ${event.type}`);
      }

      await this.markWebhookEventProcessed(webhookEvent);
      return { received: true, type: event.type, duplicate: false };
    } catch (error) {
      await this.markWebhookEventFailed(webhookEvent, error);
      throw error;
    }
  }

  async syncSubscription(stripeSubscriptionId: string) {
    const stripe = this.getStripe();
    const remote = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const currentItem = remote.items.data[0];
    const periodStartUnix = currentItem?.current_period_start ?? remote.billing_cycle_anchor;
    const periodEndUnix =
      currentItem?.current_period_end ??
      remote.cancel_at ??
      remote.trial_end ??
      remote.billing_cycle_anchor;

    const customerId =
      typeof remote.customer === 'string' ? remote.customer : remote.customer.id;
    const priceId = remote.items.data[0]?.price?.id || undefined;
    const planId =
      (remote.metadata?.planId as string | undefined) ||
      this.getPlanIdFromPrice(priceId) ||
      'plan_free';

    let tenantId: string | undefined = remote.metadata?.tenantId || undefined;
    if (!tenantId) {
      const tenant = await this.em.findOne(TenantEntity, { stripeCustomerId: customerId });
      tenantId = tenant?.id;
    }

    if (!tenantId) {
      throw new NotFoundException('Tenant not found for Stripe subscription');
    }

    const tenant = await this.getTenant(tenantId);

    let subscription = await this.em.findOne(SubscriptionEntity, {
      $or: [{ externalId: remote.id }, { tenantId }],
    });

    if (!subscription) {
      subscription = this.em.create(SubscriptionEntity, {
        tenantId,
        planId,
        externalId: remote.id,
        currentPeriodStart: new Date(periodStartUnix * 1000),
        currentPeriodEnd: new Date(periodEndUnix * 1000),
      } as any);
      this.em.persist(subscription);
    }

    subscription.planId = planId;
    subscription.externalId = remote.id;
    subscription.stripeCustomerId = customerId;
    subscription.stripePriceId = priceId;
    subscription.currentPeriodStart = new Date(periodStartUnix * 1000);
    subscription.currentPeriodEnd = new Date(periodEndUnix * 1000);
    subscription.trialEndsAt = remote.trial_end
      ? new Date(remote.trial_end * 1000)
      : undefined;
    subscription.cancelAtPeriodEnd = Boolean(remote.cancel_at_period_end);
    subscription.cancelledAt = remote.canceled_at
      ? new Date(remote.canceled_at * 1000)
      : undefined;
    subscription.status = this.mapStripeSubscriptionStatus(remote.status);

    tenant.planId = planId;
    tenant.stripeCustomerId = customerId;
    tenant.status = this.mapTenantStatus(subscription.status);

    await this.em.flush();
    return subscription;
  }

  private async markPastDue(stripeSubscriptionId: string) {
    const subscription = await this.syncSubscription(stripeSubscriptionId);
    const tenant = await this.getTenant(subscription.tenantId);

    subscription.status = SubscriptionStatus.PAST_DUE;
    tenant.status = 'past_due';
    await this.billingService.recordPaymentFailure(subscription.tenantId);
    await this.em.flush();
  }

  private async claimWebhookEvent(event: Stripe.Event) {
    const fork = this.em.fork();

    try {
      const webhookEvent = fork.create(StripeWebhookEventEntity, {
        eventId: event.id,
        eventType: event.type,
        status: StripeWebhookEventStatus.PROCESSING,
        attempts: 1,
      } as any);

      await fork.persistAndFlush(webhookEvent);
      return this.em.findOneOrFail(StripeWebhookEventEntity, {
        eventId: event.id,
      });
    } catch (error) {
      if (!this.isUniqueViolation(error)) {
        throw error;
      }

      const existing = await this.em.findOne(StripeWebhookEventEntity, {
        eventId: event.id,
      });

      if (!existing) {
        throw error;
      }

      if (existing.status === StripeWebhookEventStatus.FAILED) {
        existing.status = StripeWebhookEventStatus.PROCESSING;
        existing.attempts += 1;
        existing.lastError = undefined;
        existing.processedAt = undefined;
        await this.em.flush();
        return existing;
      }

      return null;
    }
  }

  private async markWebhookEventProcessed(webhookEvent: StripeWebhookEventEntity) {
    webhookEvent.status = StripeWebhookEventStatus.PROCESSED;
    webhookEvent.processedAt = new Date();
    webhookEvent.lastError = undefined;
    await this.em.flush();
  }

  private async markWebhookEventFailed(
    webhookEvent: StripeWebhookEventEntity,
    error: unknown,
  ) {
    webhookEvent.status = StripeWebhookEventStatus.FAILED;
    webhookEvent.lastError = this.normalizeErrorMessage(error);
    await this.em.flush();
  }

  private getStripe() {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    return this.stripe;
  }

  private async getTenant(tenantId: string) {
    const tenant = await this.em.findOne(TenantEntity, { id: tenantId });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  private getPriceId(planId: string) {
    const priceId = this.priceIds[planId];
    if (!priceId) {
      throw new BadRequestException(`Stripe price ID not configured for ${planId}`);
    }
    return priceId;
  }

  private getPlanIdFromPrice(priceId?: string) {
    if (!priceId) return undefined;

    return Object.entries(this.priceIds).find(([, configured]) => configured === priceId)?.[0];
  }

  private getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
    const subscription = invoice.parent?.subscription_details?.subscription;
    if (!subscription) {
      return undefined;
    }

    return typeof subscription === 'string' ? subscription : subscription.id;
  }

  private mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
    switch (status) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'past_due':
      case 'unpaid':
        return SubscriptionStatus.PAST_DUE;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      case 'canceled':
      case 'incomplete_expired':
      case 'paused':
        return SubscriptionStatus.CANCELLED;
      default:
        return SubscriptionStatus.ACTIVE;
    }
  }

  private mapTenantStatus(status: SubscriptionStatus) {
    switch (status) {
      case SubscriptionStatus.TRIALING:
        return 'trial';
      case SubscriptionStatus.PAST_DUE:
        return 'past_due';
      case SubscriptionStatus.CANCELLED:
        return 'cancelled';
      case SubscriptionStatus.ACTIVE:
      default:
        return 'active';
    }
  }

  private isUniqueViolation(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    );
  }

  private normalizeErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message.slice(0, 1000);
    }

    return 'Unknown Stripe webhook processing error';
  }
}
