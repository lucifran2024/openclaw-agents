import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Job } from 'bullmq';
import { KpiMaterializationService } from '../kpi-materialization.service';

interface KpiJobData {
  type: 'hourly' | 'daily';
}

@Injectable()
@Processor('kpi_materialization')
export class KpiMaterializationWorker extends WorkerHost {
  private readonly logger = new Logger(KpiMaterializationWorker.name);

  constructor(
    private readonly kpiService: KpiMaterializationService,
    private readonly em: EntityManager,
  ) {
    super();
  }

  async process(job: Job<KpiJobData>): Promise<void> {
    const { type } = job.data;
    this.logger.log(`Processing KPI materialization job: ${type}`);

    const tenants = await this.em.getConnection().execute<any[]>(
      `SELECT id FROM tenants WHERE status IN ('active', 'trial')`,
    );

    for (const tenant of tenants) {
      try {
        const fork = this.em.fork();
        const forkedService = new KpiMaterializationService(fork);

        if (type === 'hourly') {
          await forkedService.materializeHourly(tenant.id);
        } else if (type === 'daily') {
          await forkedService.materializeDaily(tenant.id);
        }

        this.logger.log(`Completed ${type} KPI materialization for tenant ${tenant.id}`);
      } catch (error) {
        this.logger.error(
          `Failed ${type} KPI materialization for tenant ${tenant.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
}
