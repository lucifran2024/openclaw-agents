import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './common/auth/auth.module';
import { QueueModule } from './common/queue/queue.module';
import { ObservabilityModule } from './common/observability/observability.module';
import { RedisModule } from './common/redis/redis.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { IamModule } from './modules/iam/iam.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { KanbanModule } from './modules/kanban/kanban.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { AiChatbotModule } from './modules/ai-chatbot/ai-chatbot.module';
import { BotBuilderModule } from './modules/bot-builder/bot-builder.module';
import { ReportsModule } from './modules/reports/reports.module';
import { BillingModule } from './modules/billing/billing.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';
import whatsappConfig from './config/whatsapp.config';
import stripeConfig from './config/stripe.config';
import { validateRuntimeEnv } from './config/runtime-env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig, jwtConfig, whatsappConfig, stripeConfig],
      envFilePath: ['.env.local', '.env'],
      validate: validateRuntimeEnv,
    }),
    DatabaseModule,
    AuthModule,
    RedisModule,
    QueueModule,
    ObservabilityModule,
    TenantModule,
    IamModule,
    ContactsModule,
    WhatsAppModule,
    InboxModule,
    KanbanModule,
    DashboardModule,
    CampaignsModule,
    SchedulingModule,
    AiChatbotModule,
    BotBuilderModule,
    ReportsModule,
    BillingModule,
    OnboardingModule,
  ],
})
export class AppModule {}
