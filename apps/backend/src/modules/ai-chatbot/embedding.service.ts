import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly apiKey: string;
  private readonly model = 'text-embedding-3-small';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');
  }

  /**
   * Generate a single embedding vector (1536 dimensions).
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`OpenAI embedding API error: ${response.status} ${error}`);
      throw new Error(`OpenAI embedding API error: ${response.status}`);
    }

    const data: any = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Generate embeddings for multiple texts in a single API call (batched).
   * OpenAI supports up to 2048 inputs per call.
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const BATCH_SIZE = 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: batch,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`OpenAI batch embedding API error: ${response.status} ${error}`);
        throw new Error(`OpenAI batch embedding API error: ${response.status}`);
      }

      const data: any = await response.json();
      // Sort by index to ensure ordering
      const sorted = data.data.sort(
        (a: { index: number }, b: { index: number }) => a.index - b.index,
      );
      allEmbeddings.push(...sorted.map((item: { embedding: number[] }) => item.embedding));

      this.logger.debug(
        `Embedded batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)}`,
      );
    }

    return allEmbeddings;
  }

  /**
   * Convert a number[] embedding to the pgvector string format: [0.1,0.2,...]
   */
  vectorToString(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }
}
