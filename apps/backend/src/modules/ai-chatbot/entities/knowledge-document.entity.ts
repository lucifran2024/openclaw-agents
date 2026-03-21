import { Entity, Property, Enum, Index } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

export enum DocumentSourceType {
  MANUAL = 'manual',
  UPLOAD = 'upload',
  URL = 'url',
  CONVERSATION = 'conversation',
}

export enum DocumentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

@Entity({ tableName: 'knowledge_documents' })
@Index({ properties: ['tenantId', 'knowledgeBaseId'] })
@Index({ properties: ['tenantId', 'status'] })
export class KnowledgeDocumentEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 26 })
  knowledgeBaseId!: string;

  @Property({ type: 'varchar', length: 500 })
  title!: string;

  @Property({ type: 'text', nullable: true })
  content?: string;

  @Property({ type: 'varchar', length: 2048, nullable: true })
  sourceUrl?: string;

  @Enum({ items: () => DocumentSourceType, default: DocumentSourceType.MANUAL })
  sourceType: DocumentSourceType = DocumentSourceType.MANUAL;

  @Property({ type: 'varchar', length: 255, nullable: true })
  mimeType?: string;

  @Enum({ items: () => DocumentStatus, default: DocumentStatus.PENDING })
  status: DocumentStatus = DocumentStatus.PENDING;

  @Property({ type: 'int', default: 0 })
  chunkCount: number = 0;
}
