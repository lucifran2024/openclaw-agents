import { Injectable, Logger } from '@nestjs/common';
import { ClassifierResult } from './classifier.service';

export interface RouterResult {
  destination: 'bot' | 'rag' | 'human';
  queue?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface ConversationContext {
  previousEscalations?: number;
  messageCount?: number;
  isReturningCustomer?: boolean;
}

@Injectable()
export class RouterService {
  private readonly logger = new Logger(RouterService.name);

  /**
   * Agent 2: Route the message to the appropriate handler based on classification
   * and conversation context.
   */
  route(
    classifierResult: ClassifierResult,
    context: ConversationContext = {},
  ): RouterResult {
    const { intent, sentiment, confidence } = classifierResult;

    // Low confidence -> escalate to human
    if (confidence < 0.4) {
      this.logger.debug(`Low confidence (${confidence}), routing to human`);
      return { destination: 'human', priority: 'normal' };
    }

    // Complaints always go to human agents with high priority
    if (intent === 'complaint') {
      this.logger.debug('Complaint detected, routing to human');
      return { destination: 'human', priority: 'high' };
    }

    // Negative sentiment with moderate confidence -> human
    if (sentiment === 'negative' && confidence < 0.7) {
      this.logger.debug('Negative sentiment with moderate confidence, routing to human');
      return { destination: 'human', priority: 'high' };
    }

    // Technical support -> RAG first, may escalate
    if (intent === 'technical_support') {
      this.logger.debug('Technical support, routing to RAG');
      return { destination: 'rag', queue: 'technical' };
    }

    // Billing -> human (sensitive)
    if (intent === 'billing') {
      this.logger.debug('Billing inquiry, routing to human');
      return { destination: 'human', priority: 'normal' };
    }

    // FAQ, product questions -> RAG
    if (['faq', 'product_question', 'order_inquiry'].includes(intent)) {
      this.logger.debug(`Intent "${intent}", routing to RAG`);
      return { destination: 'rag' };
    }

    // Greetings and farewells -> simple bot
    if (['greeting', 'farewell'].includes(intent)) {
      this.logger.debug(`Intent "${intent}", routing to bot`);
      return { destination: 'bot' };
    }

    // Too many previous escalations -> human directly
    if (context.previousEscalations && context.previousEscalations >= 2) {
      this.logger.debug('Multiple previous escalations, routing to human');
      return { destination: 'human', priority: 'normal' };
    }

    // Default: try RAG
    this.logger.debug('Default routing to RAG');
    return { destination: 'rag' };
  }
}
