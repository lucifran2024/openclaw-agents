import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { OnboardingConfigEntity } from './onboarding-config.entity';
import { OnboardingService } from './onboarding.service';
import { WhitelabelService } from './whitelabel.service';
import { OnboardingController } from './onboarding.controller';
import { TenantModule } from '../tenant/tenant.module';
import { ContactsModule } from '../contacts/contacts.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { KanbanModule } from '../kanban/kanban.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([OnboardingConfigEntity]),
    TenantModule,
    ContactsModule,
    SchedulingModule,
    KanbanModule,
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService, WhitelabelService],
  exports: [OnboardingService, WhitelabelService],
})
export class OnboardingModule {}
