import { Entity, Property } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../common/database/base.entity';

@Entity({ tableName: 'sla_policies' })
export class SlaPolicyEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 255 })
  name!: string;

  @Property({ type: 'int' })
  firstResponseMinutes!: number;

  @Property({ type: 'int' })
  resolutionMinutes!: number;

  @Property({ type: 'jsonb', default: '{}' })
  priorityOverrides: Record<string, { firstResponse: number; resolution: number }> = {};

  @Property({ type: 'jsonb', default: '{}' })
  businessHours: Record<string, unknown> = {};
}
