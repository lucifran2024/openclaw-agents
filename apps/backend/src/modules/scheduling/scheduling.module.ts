import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { ServiceTypeEntity } from './entities/service-type.entity';
import { ResourceEntity } from './entities/resource.entity';
import { ScheduleRuleEntity } from './entities/schedule-rule.entity';
import { ScheduleExceptionEntity } from './entities/schedule-exception.entity';
import { AppointmentEntity } from './entities/appointment.entity';
import { WaitlistEntity } from './entities/waitlist.entity';
import { SchedulingService } from './scheduling.service';
import { AvailabilityService } from './availability.service';
import { AppointmentService } from './appointment.service';
import { WaitlistService } from './waitlist.service';
import { ReminderWorker } from './workers/reminder.worker';
import { WaitlistWorker } from './workers/waitlist.worker';
import { SchedulingController } from './scheduling.controller';
import { shouldRegisterQueueProcessors } from '../../common/runtime/app-runtime';

const schedulingWorkerProviders = [ReminderWorker, WaitlistWorker];

@Module({
  imports: [
    MikroOrmModule.forFeature([
      ServiceTypeEntity,
      ResourceEntity,
      ScheduleRuleEntity,
      ScheduleExceptionEntity,
      AppointmentEntity,
      WaitlistEntity,
    ]),
    BullModule.registerQueue(
      { name: 'scheduling_reminder' },
      { name: 'scheduling_waitlist' },
    ),
  ],
  controllers: [SchedulingController],
  providers: [
    SchedulingService,
    AvailabilityService,
    AppointmentService,
    WaitlistService,
    ...(shouldRegisterQueueProcessors() ? schedulingWorkerProviders : []),
  ],
  exports: [
    SchedulingService,
    AvailabilityService,
    AppointmentService,
    WaitlistService,
  ],
})
export class SchedulingModule {}
