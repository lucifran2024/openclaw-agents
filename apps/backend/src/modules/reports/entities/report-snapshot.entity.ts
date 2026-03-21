import { Entity, Property, Enum, Index } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

export enum SnapshotFormat {
  JSON = 'json',
  CSV = 'csv',
  XLSX = 'xlsx',
}

@Entity({ tableName: 'report_snapshots' })
@Index({ properties: ['tenantId', 'reportId'] })
export class ReportSnapshotEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 26 })
  reportId!: string;

  @Property({ type: 'jsonb', default: '{}' })
  data: Record<string, unknown> = {};

  @Enum({ items: () => SnapshotFormat, default: SnapshotFormat.JSON })
  format: SnapshotFormat = SnapshotFormat.JSON;

  @Property({ type: 'varchar', length: 1024, nullable: true })
  fileUrl?: string;

  @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
  generatedAt: Date = new Date();

  @Property({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;
}
