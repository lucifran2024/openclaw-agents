import { Entity, Index, Property } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../common/database/base.entity';

@Entity({ tableName: 'api_keys' })
@Index({ properties: ['tenantId'] })
@Index({ properties: ['tenantId', 'prefix'] })
export class ApiKeyEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 120 })
  name!: string;

  @Property({ type: 'varchar', length: 64, hidden: true })
  keyHash!: string;

  @Property({ type: 'varchar', length: 16 })
  prefix!: string;

  @Property({ type: 'jsonb', default: '[]' })
  permissions: string[] = [];

  @Property({ type: 'timestamptz', nullable: true })
  lastUsedAt?: Date;

  @Property({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Property({ type: 'varchar', length: 26, nullable: true })
  createdBy?: string;
}
