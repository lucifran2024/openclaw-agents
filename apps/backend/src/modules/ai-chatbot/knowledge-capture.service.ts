import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';
import { KnowledgeDocumentEntity, DocumentSourceType, DocumentStatus } from './entities/knowledge-document.entity';
import { AiConversationLogEntity } from './entities/ai-conversation-log.entity';
import { KnowledgeBaseEntity } from './entities/knowledge-base.entity';

@Injectable()
export class KnowledgeCaptureService {
  private readonly logger = new Logger(KnowledgeCaptureService.name);
  private readonly apiKey: string;

  constructor(
    private readonly em: EntityManager,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');
  }

  /**
   * Agent 5: Analyze a human agent's resolution of an escalated conversation
   * and create a candidate knowledge base entry for review.
   */
  async captureFromResolution(
    tenantId: string,
    conversationId: string,
  ): Promise<KnowledgeDocumentEntity | null> {
    const fork = this.em.fork();

    // Get the AI conversation logs for this conversation
    const logs = await fork.find(
      AiConversationLogEntity,
      { tenantId, conversationId },
      { orderBy: { createdAt: 'ASC' } },
    );

    if (logs.length === 0) {
      this.logger.debug(`No AI logs found for conversation ${conversationId}`);
      return null;
    }

    // Only capture from escalated conversations
    const wasEscalated = logs.some((log) => log.wasEscalated);
    if (!wasEscalated) {
      this.logger.debug(`Conversation ${conversationId} was not escalated, skipping capture`);
      return null;
    }

    // Build conversation transcript from logs
    const transcript = logs
      .map((log) => {
        const parts = [`Customer: ${log.inputText}`];
        if (log.outputText) {
          parts.push(`Agent: ${log.outputText}`);
        }
        return parts.join('\n');
      })
      .join('\n\n');

    // Use OpenAI to extract a knowledge article from the resolution
    const extractedContent = await this.extractKnowledge(transcript);
    if (!extractedContent) {
      this.logger.debug(`No actionable knowledge extracted from conversation ${conversationId}`);
      return null;
    }

    // Find or use a default knowledge base for captured content
    let captureKb = await fork.findOne(KnowledgeBaseEntity, {
      tenantId,
      name: 'Auto-Captured Knowledge',
    });

    if (!captureKb) {
      captureKb = fork.create(KnowledgeBaseEntity, {
        tenantId,
        name: 'Auto-Captured Knowledge',
        description: 'Automatically captured knowledge from human agent resolutions',
      } as any);
      fork.persist(captureKb);
    }

    // Create document with status pending (for supervisor review)
    const doc = fork.create(KnowledgeDocumentEntity, {
      tenantId,
      knowledgeBaseId: captureKb.id,
      title: extractedContent.title,
      content: extractedContent.content,
      sourceType: DocumentSourceType.CONVERSATION,
      status: DocumentStatus.PENDING,
    } as any);

    captureKb.documentCount += 1;

    await fork.persistAndFlush(doc);

    this.logger.log(
      `Captured knowledge from conversation ${conversationId}: "${extractedContent.title}"`,
    );

    return doc;
  }

  private async extractKnowledge(
    transcript: string,
  ): Promise<{ title: string; content: string } | null> {
    const systemPrompt = `You are a knowledge extraction agent. Given a customer support conversation transcript,
extract a reusable knowledge base article that could help answer similar questions in the future.

Return a JSON object with:
- "title": A concise title for the knowledge article
- "content": The knowledge article content written as a clear FAQ-style answer
- "actionable": boolean - whether this conversation contains actionable knowledge worth saving

If the conversation does not contain useful knowledge (e.g., it's just a greeting or generic), set "actionable" to false.
Return ONLY valid JSON.`;

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
            { role: 'user', content: transcript },
          ],
          temperature: 0.2,
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`OpenAI knowledge extraction error: ${response.status} ${error}`);
        return null;
      }

      const data: any = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      if (!result.actionable) return null;

      return { title: result.title, content: result.content };
    } catch (error) {
      this.logger.error('Knowledge extraction failed', error);
      return null;
    }
  }
}
