import { Entity, Property, Index } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

@Entity({ tableName: 'schedule_rules' })
@Index({ properties: ['tenantId', 'resourceId'] })
export class ScheduleRuleEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 26 })
  resourceId!: string;

  @Property({ type: 'smallint' })
  dayOfWeek!: number;

  @Property({ type: 'varchar', length: 5 })
  startTime!: string;

  @Property({ type: 'varchar', length: 5 })
  endTime!: string;

  @Property({ type: 'boolean', default: true })
  isActive: boolean = true;
}
