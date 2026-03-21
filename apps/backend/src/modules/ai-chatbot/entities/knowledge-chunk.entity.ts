import { Entity, Property, Index, PrimaryKey } from '@mikro-orm/core';
import { ulid } from 'ulid';

@Entity({ tableName: 'knowledge_chunks' })
@Index({
  expression:
    'CREATE INDEX idx_knowledge_chunks_tenant_kb ON knowledge_chunks (tenant_id, knowledge_base_id)',
})
@Index({
  expression:
    'CREATE INDEX idx_knowledge_chunks_document ON knowledge_chunks (document_id)',
})
export class KnowledgeChunkEntity {
  @PrimaryKey({ type: 'varchar', length: 26 })
  id: string = ulid();

  @Property({ type: 'varchar', length: 26 })
  tenantId!: string;

  @Property({ type: 'varchar', length: 26 })
  documentId!: string;

  @Property({ type: 'varchar', length: 26 })
  knowledgeBaseId!: string;

  @Property({ type: 'text' })
  content!: string;

  @Property({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown> = {};

  @Property({ type: 'int' })
  tokenCount!: number;

  @Property({ type: 'int' })
  chunkIndex!: number;

  /**
   * Stored as vector(1536) in PostgreSQL via pgvector.
   * MikroORM sees it as a string; use raw SQL for vector operations.
   */
  @Property({ type: 'text', nullable: true })
  embedding?: string;

  @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
  createdAt: Date = new Date();
}
