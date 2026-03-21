import { Entity, Property, Index } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

@Entity({ tableName: 'usage_records' })
@Index({ properties: ['tenantId', 'metric'] })
@Index({ properties: ['tenantId', 'metric', 'periodStart', 'periodEnd'] })
export class UsageRecordEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 100 })
  metric!: string;

  @Property({ type: 'float', default: 0 })
  value: number = 0;

  @Property({ type: 'timestamptz' })
  periodStart!: Date;

  @Property({ type: 'timestamptz' })
  periodEnd!: Date;
}
