import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ExportJobEntity, ExportFormat, ExportStatus } from './entities/export-job.entity';

export interface CreateExportDto {
  type: string;
  filters?: Record<string, unknown>;
  format: ExportFormat;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    private readonly em: EntityManager,
    @InjectQueue('reports_export') private readonly exportQueue: Queue,
  ) {}

  async createExportJob(
    tenantId: string,
    userId: string,
    dto: CreateExportDto,
  ): Promise<ExportJobEntity> {
    const job = this.em.create(ExportJobEntity, {
      tenantId,
      type: dto.type,
      filters: dto.filters ?? {},
      format: dto.format,
      status: ExportStatus.PENDING,
      progress: 0,
      createdBy: userId,
    } as any);

    await this.em.persistAndFlush(job);

    await this.exportQueue.add(
      'process-export',
      {
        tenantId,
        exportJobId: job.id,
      },
      {
        jobId: `export:${job.id}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    this.logger.log(`Export job created: ${job.id} by user ${userId}`);
    return job;
  }

  async getExportStatus(
    tenantId: string,
    id: string,
  ): Promise<ExportJobEntity> {
    const job = await this.em.findOne(ExportJobEntity, { id, tenantId });
    if (!job) throw new NotFoundException('Export job not found');
    return job;
  }

  generateCsv(data: Record<string, unknown>[], columns: string[]): string {
    if (data.length === 0) return columns.join(',') + '\n';

    const header = columns.join(',');
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return '';
          const str = String(val);
          // Escape CSV values containing commas, quotes, or newlines
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(','),
    );

    return [header, ...rows].join('\n') + '\n';
  }

  generateXlsx(data: Record<string, unknown>[], columns: string[]): Buffer {
    // Simple CSV-based buffer as xlsx placeholder
    // In production, use a library like exceljs or xlsx
    const csv = this.generateCsv(data, columns);
    return Buffer.from(csv, 'utf-8');
  }
}
