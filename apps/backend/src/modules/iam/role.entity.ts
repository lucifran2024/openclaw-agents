import { Entity, Property } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../common/database/base.entity';

@Entity({ tableName: 'roles' })
export class RoleEntity extends TenantBaseEntity {
  @Property()
  name!: string;

  @Property({ type: 'jsonb', default: '[]' })
  permissions: string[] = [];

  @Property({ default: false })
  isSystem: boolean = false;
}
