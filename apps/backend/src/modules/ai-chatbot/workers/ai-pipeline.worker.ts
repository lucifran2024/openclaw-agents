import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EntityManager } from '@mikro-orm/postgresql';
import { AiPipelineService } from '../ai-pipeline.service';
import { KnowledgeCaptureService } from '../knowledge-capture.service';

interface PipelineJobData {
  tenantId: string;
  conversationId: string;
  messageId?: string;
  text: string;
}

@Processor('ai_pipeline', {
  concurrency: 5,
})
export class AiPipelineWorker extends WorkerHost {
  private readonly logger = new Logger(AiPipelineWorker.name);

  constructor(
    private readonly em: EntityManager,
    private readonly aiPipelineService: AiPipelineService,
    private readonly knowledgeCaptureService: KnowledgeCaptureService,
  ) {
    super();
  }

  async process(job: Job<PipelineJobData>): Promise<void> {
    const { tenantId, conversationId, messageId, text } = job.data;
    this.logger.log(
      `Processing AI pipeline for conversation ${conversationId}, message ${messageId || 'N/A'}`,
    );

    try {
      const result = await this.aiPipelineService.processMessage(
        tenantId,
        conversationId,
        text,
        messageId,
      );

      const fork = this.em.fork();

      if (result.response && !result.shouldEscalate) {
        // Create a bot message in the conversation
        const connection = fork.getConnection();
        const { ulid } = await import('ulid');
        const botMessageId = ulid();

        await connection.execute(
          `INSERT INTO messages (id, tenant_id, conversation_id, sender_type, content_type, content, status, source, created_at, updated_at)
           VALUES (?, ?, ?, 'bot', 'text', ?::jsonb, 'sent', 'webhook', NOW(), NOW())`,
          [
            botMessageId,
            tenantId,
            conversationId,
            JSON.stringify({ text: result.response }),
          ],
        );

        this.logger.log(
          `Bot response created for conversation ${conversationId} (confidence: ${result.confidence})`,
        );
      }

      if (result.shouldEscalate) {
        // Update conversation: remove bot assignment, mark for human pickup
        const connection = fork.getConnection();
        await connection.execute(
          `UPDATE conversations SET status = 'open', assigned_to = NULL, updated_at = NOW()
           WHERE id = ? AND tenant_id = ?`,
          [conversationId, tenantId],
        );

        this.logger.log(
          `Conversation ${conversationId} escalated to human (confidence: ${result.confidence})`,
        );
      }
    } catch (error) {
      this.logger.error(
        `AI pipeline failed for conversation ${conversationId}`,
        error,
      );
      throw error;
    }
  }
}
