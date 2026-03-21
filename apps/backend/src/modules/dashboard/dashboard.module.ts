import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { MaterializedKpiEntity } from './entities/materialized-kpi.entity';
import { WidgetLayoutEntity } from './entities/widget-layout.entity';
import { DashboardService } from './dashboard.service';
import { KpiMaterializationService } from './kpi-materialization.service';
import { KpiMaterializationWorker } from './workers/kpi-materialization.worker';
import { DashboardController } from './dashboard.controller';
import { shouldRegisterQueueProcessors } from '../../common/runtime/app-runtime';

const dashboardWorkerProviders = [KpiMaterializationWorker];

@Module({
  imports: [
    MikroOrmModule.forFeature([
      MaterializedKpiEntity,
      WidgetLayoutEntity,
    ]),
    BullModule.registerQueue({
      name: 'kpi_materialization',
    }),
  ],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    KpiMaterializationService,
    ...(shouldRegisterQueueProcessors() ? dashboardWorkerProviders : []),
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
