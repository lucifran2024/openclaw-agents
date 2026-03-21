import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { CampaignEntity } from './entities/campaign.entity';
import { CampaignMessageEntity } from './entities/campaign-message.entity';
import { CampaignSuppressionEntity } from './entities/campaign-suppression.entity';
import { OptOutEntity } from './entities/opt-out.entity';
import { CampaignService } from './campaign.service';
import { CampaignGovernorService } from './campaign-governor.service';
import { SuppressionService } from './suppression.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignDispatcherWorker } from './workers/campaign-dispatcher.worker';
import { CampaignSenderWorker } from './workers/campaign-sender.worker';
import { CampaignDlqWorker } from './workers/campaign-dlq.worker';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { RedisModule } from '../../common/redis/redis.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      CampaignEntity,
      CampaignMessageEntity,
      CampaignSuppressionEntity,
      OptOutEntity,
    ]),
    BullModule.registerQueue(
      { name: 'campaign_dispatch' },
      {
        name: 'campaign_send',
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: false,
        },
      },
      { name: 'campaign_dlq' },
    ),
    WhatsAppModule,
    RedisModule,
  ],
  controllers: [CampaignsController],
  providers: [
    CampaignService,
    CampaignGovernorService,
    SuppressionService,
    CampaignDispatcherWorker,
    CampaignSenderWorker,
    CampaignDlqWorker,
  ],
  exports: [CampaignService, CampaignGovernorService, SuppressionService],
})
export class CampaignsModule {}
