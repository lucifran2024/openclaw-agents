import { Entity, Property } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../common/database/base.entity';

@Entity({ tableName: 'audit_logs' })
export class AuditLogEntity extends TenantBaseEntity {
  @Property()
  userId!: string;

  @Property()
  action!: string;

  @Property()
  entityType!: string;

  @Property()
  entityId!: string;

  @Property({ type: 'jsonb', nullable: true })
  oldValue?: Record<string, unknown>;

  @Property({ type: 'jsonb', nullable: true })
  newValue?: Record<string, unknown>;

  @Property({ nullable: true })
  ip?: string;

  @Property({ nullable: true })
  userAgent?: string;
}
