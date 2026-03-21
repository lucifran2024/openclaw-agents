import { Entity, Property, Enum, Index } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

export enum ExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
  PDF = 'pdf',
}

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity({ tableName: 'export_jobs' })
@Index({ properties: ['tenantId', 'status'] })
@Index({ properties: ['tenantId', 'createdBy'] })
export class ExportJobEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 100 })
  type!: string;

  @Property({ type: 'jsonb', default: '{}' })
  filters: Record<string, unknown> = {};

  @Enum({ items: () => ExportFormat })
  format!: ExportFormat;

  @Enum({ items: () => ExportStatus, default: ExportStatus.PENDING })
  status: ExportStatus = ExportStatus.PENDING;

  @Property({ type: 'varchar', length: 1024, nullable: true })
  fileUrl?: string;

  @Property({ type: 'text', nullable: true })
  error?: string;

  @Property({ type: 'int', default: 0 })
  progress: number = 0;

  @Property({ type: 'varchar', length: 26 })
  createdBy!: string;
}
