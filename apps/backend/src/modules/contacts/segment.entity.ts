import { Entity, Property } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../common/database/base.entity';

@Entity({ tableName: 'segments' })
export class SegmentEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 255 })
  name!: string;

  @Property({ type: 'jsonb' })
  rules!: Record<string, unknown>[];

  @Property({ type: 'boolean', default: true })
  isDynamic: boolean = true;

  @Property({ type: 'int', default: 0 })
  contactCount: number = 0;

  @Property({ type: 'timestamptz', nullable: true })
  lastComputedAt?: Date;
}
