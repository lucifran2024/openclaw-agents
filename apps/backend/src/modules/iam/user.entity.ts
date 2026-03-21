import { Entity, Property, Enum, ManyToOne } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../common/database/base.entity';

@Entity({ tableName: 'users' })
export class UserEntity extends TenantBaseEntity {
  @Property()
  email!: string;

  @Property({ hidden: true })
  passwordHash!: string;

  @Property()
  name!: string;

  @Property({ nullable: true })
  roleId?: string;

  @Enum({ items: () => ['owner', 'admin', 'supervisor', 'agent', 'viewer'], default: 'agent' })
  role: string = 'agent';

  @Enum({ items: () => ['active', 'inactive', 'invited'], default: 'active' })
  status: string = 'active';

  @Property({ type: 'jsonb', default: '[]' })
  teams: string[] = [];

  @Property({ type: 'jsonb', default: '[]' })
  units: string[] = [];

  @Property({ nullable: true })
  mfaSecret?: string;

  @Property({ type: 'timestamptz', nullable: true })
  lastLogin?: Date;
}
