import { Entity, Property, Enum, Index } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

export enum ResourceType {
  PROFESSIONAL = 'professional',
  ROOM = 'room',
  EQUIPMENT = 'equipment',
  TABLE = 'table',
}

@Entity({ tableName: 'resources' })
@Index({ properties: ['tenantId'] })
@Index({ properties: ['tenantId', 'type'] })
export class ResourceEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 255 })
  name!: string;

  @Enum({ items: () => ResourceType })
  type!: ResourceType;

  @Property({ type: 'varchar', length: 26, nullable: true })
  userId?: string;

  @Property({ type: 'jsonb', default: '[]' })
  serviceTypeIds: string[] = [];

  @Property({ type: 'boolean', default: true })
  isActive: boolean = true;
}
