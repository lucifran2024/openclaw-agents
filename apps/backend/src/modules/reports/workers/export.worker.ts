import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EntityManager } from '@mikro-orm/postgresql';
import { ExportJobEntity, ExportStatus, ExportFormat } from '../entities/export-job.entity';
import { ExportService } from '../export.service';
import { ReportService } from '../report.service';
import { ReportType } from '../entities/saved-report.entity';

interface ExportJobData {
  tenantId: string;
  exportJobId: string;
}

@Processor('reports_export', {
  concurrency: 2,
})
export class ExportWorker extends WorkerHost {
  private readonly logger = new Logger(ExportWorker.name);

  constructor(
    private readonly em: EntityManager,
    private readonly exportService: ExportService,
    private readonly reportService: ReportService,
  ) {
    super();
  }

  async process(job: Job<ExportJobData>): Promise<void> {
    const { tenantId, exportJobId } = job.data;
    const fork = this.em.fork();

    this.logger.log(`Processing export job ${exportJobId}`);

    const exportJob = await fork.findOne(ExportJobEntity, {
      id: exportJobId,
      tenantId,
    });

    if (!exportJob) {
      this.logger.error(`Export job ${exportJobId} not found`);
      return;
    }

    try {
      // Mark as processing
      exportJob.status = ExportStatus.PROCESSING;
      exportJob.progress = 10;
      await fork.flush();

      // Generate report data based on type
      const reportData = await this.generateReportData(
        tenantId,
        exportJob.type,
        exportJob.filters,
      );

      exportJob.progress = 50;
      await fork.flush();
      await job.updateProgress(50);

      // Convert to requested format
      const columns = reportData.length > 0 ? Object.keys(reportData[0]) : [];
      let fileContent: string | Buffer;

      switch (exportJob.format) {
        case ExportFormat.CSV:
          fileContent = this.exportService.generateCsv(reportData, columns);
          break;
        case ExportFormat.XLSX:
          fileContent = this.exportService.generateXlsx(reportData, columns);
          break;
        case ExportFormat.PDF:
          // PDF generation placeholder — in production use pdfkit or similar
          fileContent = this.exportService.generateCsv(reportData, columns);
          break;
        default:
          fileContent = this.exportService.generateCsv(reportData, columns);
      }

      exportJob.progress = 80;
      await fork.flush();
      await job.updateProgress(80);

      // In production, upload to S3 and set fileUrl
      // For now, store a local placeholder path
      const fileName = `export_${exportJobId}.${exportJob.format}`;
      exportJob.fileUrl = `/exports/${tenantId}/${fileName}`;

      exportJob.status = ExportStatus.COMPLETED;
      exportJob.progress = 100;
      await fork.flush();
      await job.updateProgress(100);

      this.logger.log(`Export job ${exportJobId} completed`);
    } catch (error) {
      this.logger.error(
        `Export job ${exportJobId} failed: ${(error as Error).message}`,
      );
      exportJob.status = ExportStatus.FAILED;
      exportJob.error = (error as Error).message;
      await fork.flush();
    }
  }

  private async generateReportData(
    tenantId: string,
    type: string,
    filters: Record<string, unknown>,
  ): Promise<Record<string, unknown>[]> {
    const knex = this.em.getKnex();

    const dateFrom = (filters.dateFrom as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = (filters.dateTo as string) || new Date().toISOString();

    switch (type) {
      case ReportType.CONVERSATIONS: {
        return knex('conversations')
          .where('tenant_id', tenantId)
          .whereBetween('created_at', [dateFrom, dateTo])
          .select('id', 'status', 'assigned_to', 'created_at', 'updated_at');
      }
      case ReportType.AGENTS: {
        return knex('conversations')
          .where('tenant_id', tenantId)
          .whereBetween('created_at', [dateFrom, dateTo])
          .whereNotNull('assigned_to')
          .select('assigned_to')
          .count('id as total_conversations')
          .groupBy('assigned_to');
      }
      case ReportType.CAMPAIGNS: {
        return knex('campaigns')
          .where('tenant_id', tenantId)
          .whereBetween('created_at', [dateFrom, dateTo])
          .select('id', 'name', 'status', 'created_at', 'started_at', 'completed_at');
      }
      case ReportType.CONTACTS: {
        return knex('contacts')
          .where('tenant_id', tenantId)
          .whereNull('deleted_at')
          .whereBetween('created_at', [dateFrom, dateTo])
          .select('id', 'name', 'phone', 'email', 'created_at');
      }
      case ReportType.APPOINTMENTS: {
        return knex('appointments')
          .where('tenant_id', tenantId)
          .whereBetween('created_at', [dateFrom, dateTo])
          .select('id', 'status', 'scheduled_at', 'created_at');
      }
      default:
        return [];
    }
  }
}
