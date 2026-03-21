import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendMessageParams {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  type: 'text' | 'template' | 'image' | 'video' | 'audio' | 'document' | 'interactive' | 'location' | 'reaction';
  content: Record<string, unknown>;
}

interface SendMessageResult {
  messageId: string;
  success: boolean;
  error?: string;
}

interface TemplateInfo {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  components: any[];
}

@Injectable()
export class WhatsAppCloudAdapter {
  private readonly logger = new Logger(WhatsAppCloudAdapter.name);
  private readonly baseUrl: string;
  private readonly apiVersion: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get('whatsapp.baseUrl') || 'https://graph.facebook.com';
    this.apiVersion = this.configService.get('whatsapp.apiVersion') || 'v21.0';
  }

  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    const url = `${this.baseUrl}/${this.apiVersion}/${params.phoneNumberId}/messages`;

    try {
      const body: Record<string, unknown> = {
        messaging_product: 'whatsapp',
        to: params.to,
        type: params.type,
        ...this.buildMessagePayload(params.type, params.content),
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${params.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data: any = await response.json();

      if (!response.ok) {
        this.logger.error(`WhatsApp API error: ${JSON.stringify(data)}`);
        return {
          messageId: '',
          success: false,
          error: data.error?.message || `HTTP ${response.status}`,
        };
      }

      return {
        messageId: data.messages?.[0]?.id || '',
        success: true,
      };
    } catch (error) {
      this.logger.error(`WhatsApp send failed: ${(error as Error).message}`);
      return { messageId: '', success: false, error: (error as Error).message };
    }
  }

  async getTemplates(wabaId: string, accessToken: string): Promise<TemplateInfo[]> {
    const url = `${this.baseUrl}/${this.apiVersion}/${wabaId}/message_templates`;

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      const data: any = await response.json();
      if (!response.ok) return [];

      return (data.data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        language: t.language,
        category: t.category,
        status: t.status,
        components: t.components || [],
      }));
    } catch {
      return [];
    }
  }

  verifyWebhookSignature(payload: string, signature: string, appSecret: string): boolean {
    // HMAC-SHA256 verification
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');
    return `sha256=${expectedSignature}` === signature;
  }

  private buildMessagePayload(type: string, content: Record<string, unknown>): Record<string, unknown> {
    switch (type) {
      case 'text':
        return { text: { preview_url: false, body: content.text } };
      case 'template':
        return {
          template: {
            name: content.templateName,
            language: { code: content.language || 'pt_BR' },
            components: content.components || [],
          },
        };
      case 'image':
        return { image: { link: content.url, caption: content.caption } };
      case 'document':
        return { document: { link: content.url, filename: content.filename, caption: content.caption } };
      case 'interactive':
        return { interactive: content.interactive };
      case 'reaction':
        return { reaction: { message_id: content.messageId, emoji: content.emoji } };
      default:
        return { [type]: content };
    }
  }
}
