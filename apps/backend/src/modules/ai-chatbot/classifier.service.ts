import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ClassifierResult {
  intent: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
}

@Injectable()
export class ClassifierService {
  private readonly logger = new Logger(ClassifierService.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');
  }

  /**
   * Agent 1: Classify the user's message to determine intent, sentiment, and confidence.
   */
  async classify(text: string): Promise<ClassifierResult> {
    const systemPrompt = `You are a message classifier for a customer support system.
Analyze the user message and return a JSON object with:
- "intent": one of "faq", "complaint", "order_inquiry", "product_question", "greeting", "farewell", "billing", "technical_support", "feedback", "other"
- "sentiment": one of "positive", "neutral", "negative"
- "confidence": a number between 0 and 1 indicating your classification confidence

Return ONLY valid JSON. No explanation.`;

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
            { role: 'user', content: text },
          ],
          temperature: 0,
          max_tokens: 150,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`OpenAI classifier error: ${response.status} ${error}`);
        return { intent: 'other', sentiment: 'neutral', confidence: 0 };
      }

      const data: any = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      return {
        intent: result.intent || 'other',
        sentiment: result.sentiment || 'neutral',
        confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
      };
    } catch (error) {
      this.logger.error('Classifier failed', error);
      return { intent: 'other', sentiment: 'neutral', confidence: 0 };
    }
  }
}
