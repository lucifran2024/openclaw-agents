import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EntityManager } from '@mikro-orm/postgresql';
import { ulid } from 'ulid';
import { EmbeddingService } from '../embedding.service';
import { KnowledgeService } from '../knowledge.service';
import { KnowledgeDocumentEntity, DocumentStatus } from '../entities/knowledge-document.entity';
import { KnowledgeBaseEntity } from '../entities/knowledge-base.entity';

interface EmbeddingJobData {
  tenantId: string;
  documentId: string;
}

@Processor('ai_embedding', {
  concurrency: 2,
})
export class EmbeddingWorker extends WorkerHost {
  private readonly logger = new Logger(EmbeddingWorker.name);

  constructor(
    private readonly em: EntityManager,
    private readonly embeddingService: EmbeddingService,
    private readonly knowledgeService: KnowledgeService,
  ) {
    super();
  }

  async process(job: Job<EmbeddingJobData>): Promise<void> {
    const { tenantId, documentId } = job.data;
    const fork = this.em.fork();

    this.logger.log(`Processing embeddings for document ${documentId}`);

    const doc = await fork.findOne(KnowledgeDocumentEntity, { id: documentId, tenantId });
    if (!doc) {
      this.logger.error(`Document ${documentId} not found`);
      return;
    }

    if (!doc.content) {
      this.logger.error(`Document ${documentId} has no content`);
      doc.status = DocumentStatus.FAILED;
      await fork.flush();
      return;
    }

    try {
      // 1. Chunk the document
      const chunks = this.knowledgeService.chunkText(doc.content, 500, 50);
      this.logger.log(`Document ${documentId}: ${chunks.length} chunks created`);

      // 2. Generate embeddings in batch
      const embeddings = await this.embeddingService.generateEmbeddingsBatch(chunks);

      // 3. Store chunks with embeddings using raw SQL (for pgvector)
      const connection = fork.getConnection();

      for (let i = 0; i < chunks.length; i++) {
        const chunkId = ulid();
        const tokenCount = this.knowledgeService.estimateTokens(chunks[i]);
        const vectorStr = this.embeddingService.vectorToString(embeddings[i]);

        await connection.execute(
          `INSERT INTO knowledge_chunks (id, tenant_id, document_id, knowledge_base_id, content, metadata, token_count, chunk_index, embedding, created_at)
           VALUES (?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?::vector, NOW())`,
          [
            chunkId,
            tenantId,
            documentId,
            doc.knowledgeBaseId,
            chunks[i],
            JSON.stringify({ chunkIndex: i, totalChunks: chunks.length }),
            tokenCount,
            i,
            vectorStr,
          ],
        );

        // Update progress
        await job.updateProgress(Math.round(((i + 1) / chunks.length) * 100));
      }

      // 4. Update document status and chunk count
      doc.status = DocumentStatus.READY;
      doc.chunkCount = chunks.length;
      await fork.flush();

      // 5. Update knowledge base chunk count
      const kb = await fork.findOne(KnowledgeBaseEntity, {
        id: doc.knowledgeBaseId,
        tenantId,
      });
      if (kb) {
        kb.chunkCount += chunks.length;
        await fork.flush();
      }

      this.logger.log(
        `Document ${documentId}: ${chunks.length} chunks embedded and stored successfully`,
      );
    } catch (error) {
      this.logger.error(`Embedding processing failed for document ${documentId}`, error);
      doc.status = DocumentStatus.FAILED;
      await fork.flush();
      throw error;
    }
  }
}
