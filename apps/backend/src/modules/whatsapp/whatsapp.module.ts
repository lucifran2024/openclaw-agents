import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { WhatsAppAccountEntity } from './whatsapp-account.entity';
import { WhatsAppTemplateEntity } from './whatsapp-template.entity';
import { WebhookEventEntity } from './webhook-event.entity';
import { WhatsAppCloudAdapter } from './whatsapp-cloud.adapter';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';
import { WhatsAppSenderService } from './whatsapp-sender.service';
import { TemplateService } from './template.service';
import { WindowTrackerService } from './window-tracker.service';
import { QualityMonitorService } from './quality-monitor.service';
import { WebhookProcessorWorker } from './workers/webhook-processor.worker';
import { WhatsAppAdminController } from './whatsapp-admin.controller';

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
  ],
  controllers: [WhatsAppWebhookController, WhatsAppAdminController],
  providers: [
    WhatsAppCloudAdapter,
    WhatsAppSenderService,
    TemplateService,
    WindowTrackerService,
    QualityMonitorService,
    WebhookProcessorWorker,
  ],
  exports: [WhatsAppSenderService, TemplateService, WindowTrackerService],
})
export class WhatsAppModule {}
