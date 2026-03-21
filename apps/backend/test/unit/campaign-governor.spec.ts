import { CampaignGovernorService } from '../../src/modules/campaigns/campaign-governor.service';
import { QualityRating } from '../../src/modules/whatsapp/whatsapp-account.entity';

describe('CampaignGovernorService', () => {
  const findOne = jest.fn();
  const em = {
    fork: () => ({
      findOne,
    }),
  };

  const redis = {
    get: jest.fn(),
    incrby: jest.fn(),
    ttl: jest.fn(),
    expire: jest.fn(),
  };

  let service: CampaignGovernorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CampaignGovernorService(em as any, redis as any);
  });

  it('blocks sending when quality is RED', async () => {
    findOne.mockResolvedValue({
      qualityRating: QualityRating.RED,
      messagingTier: '1000',
    });

    const decision = await service.shouldProceed('tenant_1', 'phone_1');

    expect(decision).toEqual(
      expect.objectContaining({
        proceed: false,
      }),
    );
  });

  it('reduces the batch size when quality is YELLOW', async () => {
    findOne.mockResolvedValue({
      qualityRating: QualityRating.YELLOW,
      messagingTier: '1000',
    });
    redis.get.mockResolvedValue('100');

    const batchSize = await service.calculateBatchSize({
      tenantId: 'tenant_1',
      settings: {
        phoneNumberId: 'phone_1',
        targetCount: 600,
      },
      stats: {
        sent: 50,
        failed: 0,
      },
    } as any);

    expect(batchSize).toBe(250);
  });

  it('increments daily conversation count and sets ttl when needed', async () => {
    redis.incrby.mockResolvedValue(11);
    redis.ttl.mockResolvedValue(-1);

    const count = await service.incrementConversationCount('phone_1', 2);

    expect(count).toBe(11);
    expect(redis.expire).toHaveBeenCalledWith(expect.any(String), 172800);
  });
});
