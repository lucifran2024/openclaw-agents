import { Entity, Property, Index } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

@Entity({ tableName: 'service_types' })
@Index({ properties: ['tenantId'] })
export class ServiceTypeEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 255 })
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'int' })
  durationMinutes!: number;

  @Property({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  price?: number;

  @Property({ type: 'varchar', length: 20, nullable: true })
  color?: string;

  @Property({ type: 'boolean', default: true })
  isActive: boolean = true;
}
