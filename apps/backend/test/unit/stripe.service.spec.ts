import { StripeService } from '../../src/modules/billing/stripe.service';
import {
  StripeWebhookEventEntity,
  StripeWebhookEventStatus,
} from '../../src/modules/billing/entities/stripe-webhook-event.entity';

describe('StripeService webhook idempotency', () => {
  const findOne = jest.fn();
  const findOneOrFail = jest.fn();
  const flush = jest.fn();
  const persistAndFlush = jest.fn();
  const forkCreate = jest.fn(
    (_entity: unknown, data: Partial<StripeWebhookEventEntity>) =>
      Object.assign(new StripeWebhookEventEntity(), data),
  );
  const em = {
    findOne,
    findOneOrFail,
    flush,
    fork: jest.fn(() => ({
      create: forkCreate,
      persistAndFlush,
    })),
  };

  const billingService = {
    recordPaymentFailure: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'stripe.secretKey':
          return '';
        case 'stripe.frontendUrl':
          return 'http://localhost:3000';
        case 'stripe.priceIds':
          return {};
        case 'stripe.webhookSecret':
          return 'whsec_test';
        default:
          return undefined;
      }
    }),
  };

  const event = {
    id: 'evt_123',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_123',
        subscription: 'sub_123',
      },
    },
  };

  let service: StripeService;
  let stripe: { webhooks: { constructEvent: jest.Mock } };
  let syncSubscriptionSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new StripeService(configService as any, em as any, billingService as any);
    stripe = {
      webhooks: {
        constructEvent: jest.fn().mockReturnValue(event),
      },
    };

    (service as any).stripe = stripe;
    syncSubscriptionSpy = jest
      .spyOn(service, 'syncSubscription')
      .mockResolvedValue({ id: 'subscription_1' } as any);
  });

  it('processes a new webhook event once and marks it as processed', async () => {
    const webhookEvent = Object.assign(new StripeWebhookEventEntity(), {
      eventId: event.id,
      eventType: event.type,
      status: StripeWebhookEventStatus.PROCESSING,
      attempts: 1,
    });

    persistAndFlush.mockResolvedValue(undefined);
    findOneOrFail.mockResolvedValue(webhookEvent);

    const result = await service.handleWebhook(Buffer.from('{}'), 'stripe-signature');

    expect(result).toEqual({
      received: true,
      type: 'checkout.session.completed',
      duplicate: false,
    });
    expect(syncSubscriptionSpy).toHaveBeenCalledTimes(1);
    expect(syncSubscriptionSpy).toHaveBeenCalledWith('sub_123');
    expect(webhookEvent.status).toBe(StripeWebhookEventStatus.PROCESSED);
    expect(webhookEvent.processedAt).toBeInstanceOf(Date);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('skips duplicate webhook events that were already processed', async () => {
    const firstWebhookEvent = Object.assign(new StripeWebhookEventEntity(), {
      eventId: event.id,
      eventType: event.type,
      status: StripeWebhookEventStatus.PROCESSING,
      attempts: 1,
    });
    const processedWebhookEvent = Object.assign(new StripeWebhookEventEntity(), {
      eventId: event.id,
      eventType: event.type,
      status: StripeWebhookEventStatus.PROCESSED,
      attempts: 1,
    });

    persistAndFlush
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce({ code: '23505' });
    findOneOrFail.mockResolvedValueOnce(firstWebhookEvent);
    findOne.mockResolvedValueOnce(processedWebhookEvent);

    await service.handleWebhook(Buffer.from('{}'), 'stripe-signature');
    const duplicateResult = await service.handleWebhook(
      Buffer.from('{}'),
      'stripe-signature',
    );

    expect(duplicateResult).toEqual({
      received: true,
      type: 'checkout.session.completed',
      duplicate: true,
    });
    expect(syncSubscriptionSpy).toHaveBeenCalledTimes(1);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('retries a previously failed webhook event instead of discarding it', async () => {
    const failedWebhookEvent = Object.assign(new StripeWebhookEventEntity(), {
      eventId: event.id,
      eventType: event.type,
      status: StripeWebhookEventStatus.FAILED,
      attempts: 1,
      lastError: 'temporary failure',
    });

    persistAndFlush.mockRejectedValue({ code: '23505' });
    findOne.mockResolvedValue(failedWebhookEvent);

    const result = await service.handleWebhook(Buffer.from('{}'), 'stripe-signature');

    expect(result).toEqual({
      received: true,
      type: 'checkout.session.completed',
      duplicate: false,
    });
    expect(syncSubscriptionSpy).toHaveBeenCalledTimes(1);
    expect(failedWebhookEvent.attempts).toBe(2);
    expect(failedWebhookEvent.status).toBe(StripeWebhookEventStatus.PROCESSED);
    expect(failedWebhookEvent.lastError).toBeUndefined();
    expect(failedWebhookEvent.processedAt).toBeInstanceOf(Date);
    expect(flush).toHaveBeenCalledTimes(2);
  });
});
