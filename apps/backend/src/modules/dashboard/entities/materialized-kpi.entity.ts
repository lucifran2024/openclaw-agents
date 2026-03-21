import { Entity, Property, Enum, Index } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

export enum PeriodType {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

@Entity({ tableName: 'materialized_kpis' })
@Index({ properties: ['tenantId', 'metric', 'periodType', 'periodStart'] })
export class MaterializedKpiEntity extends TenantBaseEntity {
  @Property()
  metric!: string;

  @Property({ type: 'double' })
  value!: number;

  @Property({ type: 'jsonb', default: '{}' })
  dimensions: Record<string, any> = {};

  @Property({ type: 'timestamptz' })
  periodStart!: Date;

  @Property({ type: 'timestamptz' })
  periodEnd!: Date;

  @Enum(() => PeriodType)
  periodType!: PeriodType;
}
