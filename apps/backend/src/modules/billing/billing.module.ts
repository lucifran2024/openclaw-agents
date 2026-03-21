import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SubscriptionEntity } from './entities/subscription.entity';
import { StripeWebhookEventEntity } from './entities/stripe-webhook-event.entity';
import { UsageRecordEntity } from './entities/usage-record.entity';
import { BillingService } from './billing.service';
import { PlanService } from './plan.service';
import { BillingController } from './billing.controller';
import { StripeService } from './stripe.service';
import { BillingWebhookController } from './billing-webhook.controller';
import { TenantEntity } from '../tenant/tenant.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      SubscriptionEntity,
      StripeWebhookEventEntity,
      UsageRecordEntity,
      TenantEntity,
    ]),
  ],
  controllers: [BillingController, BillingWebhookController],
  providers: [BillingService, PlanService, StripeService],
  exports: [BillingService, PlanService],
})
export class BillingModule {}
