import { Entity, Property, Enum, Index } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

export enum KnowledgeBaseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity({ tableName: 'knowledge_bases' })
@Index({ properties: ['tenantId', 'status'] })
export class KnowledgeBaseEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 255 })
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Enum({ items: () => KnowledgeBaseStatus, default: KnowledgeBaseStatus.ACTIVE })
  status: KnowledgeBaseStatus = KnowledgeBaseStatus.ACTIVE;

  @Property({ type: 'int', default: 0 })
  documentCount: number = 0;

  @Property({ type: 'int', default: 0 })
  chunkCount: number = 0;
}
