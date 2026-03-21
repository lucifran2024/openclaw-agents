import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { KnowledgeBaseEntity, KnowledgeBaseStatus } from './entities/knowledge-base.entity';
import { KnowledgeDocumentEntity, DocumentStatus } from './entities/knowledge-document.entity';
import { KnowledgeChunkEntity } from './entities/knowledge-chunk.entity';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    private readonly em: EntityManager,
    @InjectQueue('ai_embedding') private readonly embeddingQueue: Queue,
  ) {}

  // ─── Knowledge Bases ─────────────────────────────────────────

  async createKnowledgeBase(
    tenantId: string,
    data: { name: string; description?: string; status?: KnowledgeBaseStatus },
  ): Promise<KnowledgeBaseEntity> {
    const fork = this.em.fork();
    const kb = fork.create(KnowledgeBaseEntity, {
      tenantId,
      name: data.name,
      description: data.description,
      status: data.status || KnowledgeBaseStatus.ACTIVE,
    } as any);
    await fork.persistAndFlush(kb);
    return kb;
  }

  async getKnowledgeBases(tenantId: string): Promise<KnowledgeBaseEntity[]> {
    const fork = this.em.fork();
    return fork.find(KnowledgeBaseEntity, { tenantId });
  }

  async getKnowledgeBaseById(
    tenantId: string,
    id: string,
  ): Promise<KnowledgeBaseEntity | null> {
    const fork = this.em.fork();
    return fork.findOne(KnowledgeBaseEntity, { id, tenantId });
  }

  async updateKnowledgeBase(
    tenantId: string,
    id: string,
    data: Partial<{ name: string; description: string; status: KnowledgeBaseStatus }>,
  ): Promise<KnowledgeBaseEntity> {
    const fork = this.em.fork();
    const kb = await fork.findOne(KnowledgeBaseEntity, { id, tenantId });
    if (!kb) throw new NotFoundException('Knowledge base not found');
    fork.assign(kb, data);
    await fork.flush();
    return kb;
  }

  async deleteKnowledgeBase(tenantId: string, id: string): Promise<boolean> {
    const fork = this.em.fork();
    const kb = await fork.findOne(KnowledgeBaseEntity, { id, tenantId });
    if (!kb) return false;

    // Delete all associated chunks and documents
    const connection = fork.getConnection();
    await connection.execute(
      'DELETE FROM knowledge_chunks WHERE tenant_id = ? AND knowledge_base_id = ?',
      [tenantId, id],
    );
    await connection.execute(
      'DELETE FROM knowledge_documents WHERE tenant_id = ? AND knowledge_base_id = ?',
      [tenantId, id],
    );

    fork.remove(kb);
    await fork.flush();
    return true;
  }

  // ─── Documents ────────────────────────────────────────────────

  async createDocument(
    tenantId: string,
    knowledgeBaseId: string,
    data: {
      title: string;
      content?: string;
      sourceUrl?: string;
      sourceType?: string;
      mimeType?: string;
    },
  ): Promise<KnowledgeDocumentEntity> {
    const fork = this.em.fork();

    // Verify knowledge base exists
    const kb = await fork.findOne(KnowledgeBaseEntity, { id: knowledgeBaseId, tenantId });
    if (!kb) throw new NotFoundException('Knowledge base not found');

    const doc = fork.create(KnowledgeDocumentEntity, {
      tenantId,
      knowledgeBaseId,
      title: data.title,
      content: data.content,
      sourceUrl: data.sourceUrl,
      sourceType: data.sourceType || 'manual',
      mimeType: data.mimeType,
      status: DocumentStatus.PENDING,
    } as any);

    // Increment document count on KB
    kb.documentCount += 1;

    await fork.persistAndFlush(doc);
    return doc;
  }

  async getDocuments(
    tenantId: string,
    knowledgeBaseId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: KnowledgeDocumentEntity[]; total: number; page: number; limit: number }> {
    const fork = this.em.fork();
    const offset = (page - 1) * limit;

    const [data, total] = await fork.findAndCount(
      KnowledgeDocumentEntity,
      { tenantId, knowledgeBaseId },
      { limit, offset, orderBy: { createdAt: 'DESC' } },
    );

    return { data, total, page, limit };
  }

  async deleteDocument(tenantId: string, documentId: string): Promise<boolean> {
    const fork = this.em.fork();
    const doc = await fork.findOne(KnowledgeDocumentEntity, { id: documentId, tenantId });
    if (!doc) return false;

    // Delete associated chunks
    const connection = fork.getConnection();
    await connection.execute(
      'DELETE FROM knowledge_chunks WHERE tenant_id = ? AND document_id = ?',
      [tenantId, documentId],
    );

    // Update KB counters
    const kb = await fork.findOne(KnowledgeBaseEntity, {
      id: doc.knowledgeBaseId,
      tenantId,
    });
    if (kb) {
      kb.documentCount = Math.max(0, kb.documentCount - 1);
      kb.chunkCount = Math.max(0, kb.chunkCount - doc.chunkCount);
    }

    fork.remove(doc);
    await fork.flush();
    return true;
  }

  /**
   * Enqueue a document for processing (chunking + embedding).
   */
  async processDocument(tenantId: string, documentId: string): Promise<void> {
    const fork = this.em.fork();
    const doc = await fork.findOne(KnowledgeDocumentEntity, { id: documentId, tenantId });
    if (!doc) throw new NotFoundException('Document not found');

    if (!doc.content) {
      throw new Error('Document has no content to process');
    }

    doc.status = DocumentStatus.PROCESSING;
    await fork.flush();

    await this.embeddingQueue.add(
      'process-document',
      { tenantId, documentId },
      {
        jobId: `embed:${documentId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: false,
      },
    );

    this.logger.log(`Enqueued document ${documentId} for embedding processing`);
  }

  // ─── Chunking ─────────────────────────────────────────────────

  /**
   * Split text into overlapping chunks of approximately `maxTokens` tokens.
   * Uses a simple word-based splitter (1 token ~ 0.75 words).
   */
  chunkText(text: string, maxTokens = 500, overlapTokens = 50): string[] {
    const words = text.split(/\s+/);
    // Approximate: 1 token ~ 0.75 words, so maxTokens tokens ~ maxTokens / 0.75 words
    const wordsPerChunk = Math.floor(maxTokens / 0.75);
    const overlapWords = Math.floor(overlapTokens / 0.75);
    const chunks: string[] = [];

    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + wordsPerChunk, words.length);
      chunks.push(words.slice(start, end).join(' '));
      if (end >= words.length) break;
      start = end - overlapWords;
    }

    return chunks;
  }

  /**
   * Estimate token count for a text string.
   * Rough approximation: 1 token ~ 4 characters for English text.
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
