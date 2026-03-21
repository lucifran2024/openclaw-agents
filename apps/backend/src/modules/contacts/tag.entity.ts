import { Entity, Property, Unique } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../common/database/base.entity';

@Entity({ tableName: 'tags' })
@Unique({ properties: ['tenantId', 'name'] })
export class TagEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 100 })
  name!: string;

  @Property({ type: 'varchar', length: 7, default: '#6366f1' })
  color: string = '#6366f1';
}
