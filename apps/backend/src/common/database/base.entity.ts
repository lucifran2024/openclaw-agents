import { PrimaryKey, Property } from '@mikro-orm/core';
import { ulid } from 'ulid';

export abstract class BaseEntity {
  @PrimaryKey({ type: 'varchar', length: 26 })
  id: string = ulid();

  @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
  createdAt: Date = new Date();

  @Property({ type: 'timestamptz', defaultRaw: 'NOW()', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}

export abstract class TenantBaseEntity extends BaseEntity {
  @Property({ type: 'varchar', length: 26 })
  tenantId!: string;
}

export abstract class AuditableEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 26, nullable: true })
  createdBy?: string;

  @Property({ type: 'varchar', length: 26, nullable: true })
  updatedBy?: string;
}

export abstract class SoftDeletableEntity extends AuditableEntity {
  @Property({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
