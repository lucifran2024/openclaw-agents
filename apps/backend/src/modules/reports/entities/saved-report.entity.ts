import { Entity, Property, Enum, Index } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

export enum ReportType {
  CONVERSATIONS = 'conversations',
  AGENTS = 'agents',
  CAMPAIGNS = 'campaigns',
  APPOINTMENTS = 'appointments',
  CONTACTS = 'contacts',
}

export interface ReportSchedule {
  cron: string;
  format: string;
  recipients: string[];
}

@Entity({ tableName: 'saved_reports' })
@Index({ properties: ['tenantId', 'type'] })
@Index({ properties: ['tenantId', 'createdBy'] })
export class SavedReportEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 255 })
  name!: string;

  @Enum({ items: () => ReportType })
  type!: ReportType;

  @Property({ type: 'jsonb', default: '{}' })
  filters: Record<string, unknown> = {};

  @Property({ type: 'jsonb', nullable: true })
  schedule?: ReportSchedule;

  @Property({ type: 'varchar', length: 26 })
  createdBy!: string;
}
