import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ClassifierService, ClassifierResult } from './classifier.service';
import { RouterService, RouterResult } from './router.service';
import { RagService, RagAnswer } from './rag.service';
import { AiConversationLogEntity, PipelineLog } from './entities/ai-conversation-log.entity';

export interface PipelineResult {
  response?: string;
  shouldEscalate: boolean;
  confidence: number;
  logs: PipelineLog;
}

@Injectable()
export class AiPipelineService {
  private readonly logger = new Logger(AiPipelineService.name);

  /** Default confidence threshold; can be overridden per tenant. */
  private readonly defaultConfidenceThreshold = 0.75;

  constructor(
    private readonly em: EntityManager,
    private readonly classifierService: ClassifierService,
    private readonly routerService: RouterService,
    private readonly ragService: RagService,
  ) {}

  /**
   * Orchestrate the 5-agent pipeline:
   *   Message -> Classifier -> Router -> RAG/Escalation
   * Knowledge Capture is handled asynchronously after human resolution.
   */
  async processMessage(
    tenantId: string,
    conversationId: string,
    messageText: string,
    messageId?: string,
    confidenceThreshold?: number,
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const threshold = confidenceThreshold ?? this.defaultConfidenceThreshold;
    const pipelineLog: PipelineLog = {};

    // ── Agent 1: Classifier ──────────────────────────────────
    const classifierResult: ClassifierResult =
      await this.classifierService.classify(messageText);

    pipelineLog.classifier = {
      intent: classifierResult.intent,
      sentiment: classifierResult.sentiment,
      confidence: classifierResult.confidence,
    };

    this.logger.debug(
      `[${conversationId}] Classifier: intent=${classifierResult.intent}, ` +
        `sentiment=${classifierResult.sentiment}, confidence=${classifierResult.confidence}`,
    );

    // ── Agent 2: Router ──────────────────────────────────────
    const routerResult: RouterResult = this.routerService.route(classifierResult);

    pipelineLog.router = {
      destination: routerResult.destination,
      queue: routerResult.queue,
      priority: routerResult.priority,
    };

    this.logger.debug(`[${conversationId}] Router: destination=${routerResult.destination}`);

    // ── Handle simple bot responses ──────────────────────────
    if (routerResult.destination === 'bot') {
      const botResponse = this.generateBotResponse(classifierResult.intent);
      const result: PipelineResult = {
        response: botResponse,
        shouldEscalate: false,
        confidence: 1,
        logs: pipelineLog,
      };
      await this.saveLog(tenantId, conversationId, messageId, messageText, result, startTime);
      return result;
    }

    // ── Handle human escalation directly ─────────────────────
    if (routerResult.destination === 'human') {
      pipelineLog.escalation = {
        escalated: true,
        reason: `Router directed to human (intent: ${classifierResult.intent}, confidence: ${classifierResult.confidence})`,
      };

      const result: PipelineResult = {
        shouldEscalate: true,
        confidence: classifierResult.confidence,
        logs: pipelineLog,
      };
      await this.saveLog(tenantId, conversationId, messageId, messageText, result, startTime);
      return result;
    }

    // ── Agent 3: RAG ─────────────────────────────────────────
    const chunks = await this.ragService.retrieve(tenantId, messageText);
    const ragAnswer: RagAnswer = await this.ragService.generateAnswer(messageText, chunks);

    pipelineLog.rag = {
      answer: ragAnswer.answer,
      sources: ragAnswer.sources,
      confidence: ragAnswer.confidence,
    };

    this.logger.debug(
      `[${conversationId}] RAG: confidence=${ragAnswer.confidence}, sources=${ragAnswer.sources.length}`,
    );

    // ── Agent 4: Escalation check ────────────────────────────
    if (ragAnswer.confidence < threshold || ragAnswer.answer === '') {
      pipelineLog.escalation = {
        escalated: true,
        reason: `RAG confidence (${ragAnswer.confidence}) below threshold (${threshold})`,
      };

      this.logger.debug(
        `[${conversationId}] Escalation: confidence ${ragAnswer.confidence} < ${threshold}`,
      );

      const result: PipelineResult = {
        response: ragAnswer.answer || undefined,
        shouldEscalate: true,
        confidence: ragAnswer.confidence,
        logs: pipelineLog,
      };
      await this.saveLog(tenantId, conversationId, messageId, messageText, result, startTime);
      return result;
    }

    pipelineLog.escalation = { escalated: false };

    const result: PipelineResult = {
      response: ragAnswer.answer,
      shouldEscalate: false,
      confidence: ragAnswer.confidence,
      logs: pipelineLog,
    };
    await this.saveLog(tenantId, conversationId, messageId, messageText, result, startTime);
    return result;
  }

  private generateBotResponse(intent: string): string {
    switch (intent) {
      case 'greeting':
        return 'Hello! How can I help you today?';
      case 'farewell':
        return 'Thank you for reaching out! Have a great day.';
      default:
        return 'How can I assist you?';
    }
  }

  private async saveLog(
    tenantId: string,
    conversationId: string,
    messageId: string | undefined,
    inputText: string,
    result: PipelineResult,
    startTime: number,
  ): Promise<void> {
    try {
      const fork = this.em.fork();
      const log = fork.create(AiConversationLogEntity, {
        tenantId,
        conversationId,
        messageId,
        pipeline: result.logs,
        inputText,
        outputText: result.response,
        confidence: result.confidence,
        wasEscalated: result.shouldEscalate,
        responseTimeMs: Date.now() - startTime,
      } as any);
      await fork.persistAndFlush(log);
    } catch (error) {
      this.logger.error('Failed to save pipeline log', error);
    }
  }
}
