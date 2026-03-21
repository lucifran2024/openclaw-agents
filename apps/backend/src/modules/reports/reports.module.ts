import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { SavedReportEntity } from './entities/saved-report.entity';
import { ReportSnapshotEntity } from './entities/report-snapshot.entity';
import { ExportJobEntity } from './entities/export-job.entity';
import { ReportService } from './report.service';
import { ExportService } from './export.service';
import { ReportsController } from './reports.controller';
import { ExportWorker } from './workers/export.worker';
import { shouldRegisterQueueProcessors } from '../../common/runtime/app-runtime';

const reportWorkerProviders = [ExportWorker];

@Module({
  imports: [
    MikroOrmModule.forFeature([
      SavedReportEntity,
      ReportSnapshotEntity,
      ExportJobEntity,
    ]),
    BullModule.registerQueue({
      name: 'reports_export',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: false,
      },
    }),
  ],
  controllers: [ReportsController],
  providers: [
    ReportService,
    ExportService,
    ...(shouldRegisterQueueProcessors() ? reportWorkerProviders : []),
  ],
  exports: [ReportService, ExportService],
})
export class ReportsModule {}
