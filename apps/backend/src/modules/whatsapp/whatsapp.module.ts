import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { WhatsAppAccountEntity } from './whatsapp-account.entity';
import { WhatsAppTemplateEntity } from './whatsapp-template.entity';
import { WebhookEventEntity } from './webhook-event.entity';
import { WhatsAppCloudAdapter } from './whatsapp-cloud.adapter';
import { EvolutionApiAdapter } from './evolution-api.adapter';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';
import { EvolutionWebhookController } from './evolution-webhook.controller';
import { WhatsAppSenderService } from './whatsapp-sender.service';
import { TemplateService } from './template.service';
import { WindowTrackerService } from './window-tracker.service';
import { QualityMonitorService } from './quality-monitor.service';
import { WebhookProcessorWorker } from './workers/webhook-processor.worker';
import { OutboundProcessorWorker } from './workers/outbound-processor.worker';
import { WhatsAppAdminController } from './whatsapp-admin.controller';
import { EvolutionAdminController } from './evolution-admin.controller';
import { shouldRegisterQueueProcessors } from '../../common/runtime/app-runtime';
import { InboxModule } from '../inbox/inbox.module';

const whatsappWorkerProviders = [WebhookProcessorWorker, OutboundProcessorWorker];

@Module({
  imports: [
    MikroOrmModule.forFeature([
      WhatsAppAccountEntity,
      WhatsAppTemplateEntity,
      WebhookEventEntity,
    ]),
    BullModule.registerQueue(
      { name: 'whatsapp_outbound' },
      { name: 'whatsapp_webhook' },
    ),
    InboxModule,
  ],
  controllers: [
    WhatsAppWebhookController,
    EvolutionWebhookController,
    WhatsAppAdminController,
    EvolutionAdminController,
  ],
  providers: [
    WhatsAppCloudAdapter,
    EvolutionApiAdapter,
    WhatsAppSenderService,
    TemplateService,
    WindowTrackerService,
    QualityMonitorService,
    ...(shouldRegisterQueueProcessors() ? whatsappWorkerProviders : []),
  ],
  exports: [WhatsAppSenderService, TemplateService, WindowTrackerService, EvolutionApiAdapter],
})
export class WhatsAppModule {}
