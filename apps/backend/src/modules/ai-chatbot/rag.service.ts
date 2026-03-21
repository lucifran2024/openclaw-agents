import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from './embedding.service';

export interface RelevantChunk {
  id: string;
  content: string;
  documentId: string;
  knowledgeBaseId: string;
  metadata: Record<string, unknown>;
  distance: number;
  chunkIndex: number;
}

export interface RagAnswer {
  answer: string;
  sources: string[];
  confidence: number;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly apiKey: string;

  constructor(
    private readonly em: EntityManager,
    private readonly configService: ConfigService,
    private readonly embeddingService: EmbeddingService,
  ) {
    this.apiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');
  }

  /**
   * Retrieve the most relevant chunks for a query using pgvector similarity search.
   * CRITICAL: Always filters by tenant_id (RLS + explicit WHERE).
   */
  async retrieve(
    tenantId: string,
    query: string,
    limit = 5,
    knowledgeBaseId?: string,
  ): Promise<RelevantChunk[]> {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    const vectorStr = this.embeddingService.vectorToString(queryEmbedding);

    let sql = `
      SELECT id, content, document_id AS "documentId", knowledge_base_id AS "knowledgeBaseId",
             metadata, chunk_index AS "chunkIndex",
             embedding <=> $1::vector AS distance
      FROM knowledge_chunks
      WHERE tenant_id = $2
    `;
    const params: unknown[] = [vectorStr, tenantId];

    if (knowledgeBaseId) {
      sql += ` AND knowledge_base_id = $3`;
      params.push(knowledgeBaseId);
    }

    sql += ` ORDER BY embedding <=> $1::vector LIMIT $${params.length + 1}`;
    params.push(limit);

    const fork = this.em.fork();
    const connection = fork.getConnection();
    const result = await connection.execute(sql, params);

    return result.map((row: any) => ({
      id: row.id,
      content: row.content,
      documentId: row.documentId,
      knowledgeBaseId: row.knowledgeBaseId,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      distance: parseFloat(row.distance),
      chunkIndex: row.chunkIndex,
    }));
  }

  /**
   * Generate an answer using the retrieved chunks as context.
   */
  async generateAnswer(query: string, relevantChunks: RelevantChunk[]): Promise<RagAnswer> {
    if (relevantChunks.length === 0) {
      return {
        answer: 'I could not find relevant information to answer your question. Let me connect you with a human agent.',
        sources: [],
        confidence: 0,
      };
    }

    const context = relevantChunks
      .map((chunk, i) => `[Source ${i + 1}] (distance: ${chunk.distance.toFixed(4)})\n${chunk.content}`)
      .join('\n\n');

    const systemPrompt = `You are a helpful customer support assistant. Answer the user's question based ONLY on the provided context.
If the context does not contain enough information, say so honestly — do not make up information.

After your answer, rate your confidence from 0 to 1 in a JSON block like: {"confidence": 0.85}

Context:
${context}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`OpenAI RAG generation error: ${response.status} ${error}`);
        return { answer: '', sources: [], confidence: 0 };
      }

      const data: any = await response.json();
      const rawAnswer: string = data.choices[0].message.content;

      // Extract confidence from the answer text
      let confidence = 0.5;
      const confidenceMatch = rawAnswer.match(/\{"confidence":\s*([\d.]+)\}/);
      if (confidenceMatch) {
        confidence = parseFloat(confidenceMatch[1]);
      }

      // Remove the JSON confidence block from the answer
      const cleanAnswer = rawAnswer.replace(/\{"confidence":\s*[\d.]+\}/, '').trim();

      const sources = relevantChunks.map((chunk) => chunk.id);

      return { answer: cleanAnswer, sources, confidence };
    } catch (error) {
      this.logger.error('RAG answer generation failed', error);
      return { answer: '', sources: [], confidence: 0 };
    }
  }
}
