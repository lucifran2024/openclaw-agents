import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  SendMessageParams,
  SendMessageResult,
  ConnectionStatus,
  QrCodeResult,
  WhatsAppProviderInterface,
} from './whatsapp-provider.interface';

@Injectable()
export class EvolutionApiAdapter implements WhatsAppProviderInterface {
  private readonly logger = new Logger(EvolutionApiAdapter.name);
  private readonly baseUrl: string;
  private readonly globalApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get('EVOLUTION_API_URL') || 'http://localhost:8080';
    this.globalApiKey = this.configService.get('EVOLUTION_API_KEY') || '';
  }

  /**
   * Create a new Evolution API instance (WhatsApp connection)
   */
  async createInstance(instanceName: string, webhookUrl: string): Promise<{ instanceName: string; status: string }> {
    const url = `${this.baseUrl}/instance/create`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.globalApiKey,
        },
        body: JSON.stringify({
          instanceName,
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true,
          webhook: {
            url: webhookUrl,
            webhookByEvents: false,
            webhookBase64: true,
            events: [
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE',
              'CONNECTION_UPDATE',
              'QRCODE_UPDATED',
              'MESSAGES_DELETE',
            ],
          },
        }),
      });

      const data: any = await response.json();

      if (!response.ok) {
        this.logger.error(`Evolution create instance error: ${JSON.stringify(data)}`);
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return {
        instanceName: data.instance?.instanceName || instanceName,
        status: data.instance?.status || 'created',
      };
    } catch (error) {
      this.logger.error(`Failed to create Evolution instance: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get QR code for an instance
   */
  async getQrCode(instanceName: string): Promise<QrCodeResult> {
    const url = `${this.baseUrl}/instance/connect/${instanceName}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { apikey: this.globalApiKey },
      });

      const data: any = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return {
        qrCode: data.base64 || data.qrcode?.base64 || '',
        pairingCode: data.pairingCode,
      };
    } catch (error) {
      this.logger.error(`Failed to get QR code: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get connection status for an instance
   */
  async getConnectionStatus(instanceName: string, _apiKey?: string): Promise<ConnectionStatus> {
    const url = `${this.baseUrl}/instance/connectionState/${instanceName}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { apikey: this.globalApiKey },
      });

      const data: any = await response.json();

      if (!response.ok) {
        return { connected: false, state: 'unknown' };
      }

      const state = data.instance?.state || data.state || 'unknown';

      return {
        connected: state === 'open',
        state,
        phoneNumber: data.instance?.phoneNumber,
        name: data.instance?.profileName,
      };
    } catch {
      return { connected: false, state: 'unknown' };
    }
  }

  /**
   * Send a message through Evolution API
   */
  async sendMessage(instanceName: string, _accessToken: string, params: SendMessageParams): Promise<SendMessageResult> {
    try {
      switch (params.type) {
        case 'text':
          return this.sendText(instanceName, params.to, params.content.text as string);
        case 'image':
          return this.sendMedia(instanceName, params.to, 'image', params.content);
        case 'video':
          return this.sendMedia(instanceName, params.to, 'video', params.content);
        case 'audio':
          return this.sendMedia(instanceName, params.to, 'audio', params.content);
        case 'document':
          return this.sendMedia(instanceName, params.to, 'document', params.content);
        default:
          return this.sendText(instanceName, params.to, JSON.stringify(params.content));
      }
    } catch (error) {
      return { messageId: '', success: false, error: (error as Error).message };
    }
  }

  /**
   * Send a text message
   */
  private async sendText(instanceName: string, to: string, text: string): Promise<SendMessageResult> {
    const url = `${this.baseUrl}/message/sendText/${instanceName}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.globalApiKey,
      },
      body: JSON.stringify({
        number: this.normalizePhone(to),
        text,
      }),
    });

    const data: any = await response.json();

    if (!response.ok) {
      this.logger.error(`Evolution send text error: ${JSON.stringify(data)}`);
      return { messageId: '', success: false, error: data.message || `HTTP ${response.status}` };
    }

    return {
      messageId: data.key?.id || '',
      success: true,
    };
  }

  /**
   * Send media message (image, video, audio, document)
   */
  private async sendMedia(
    instanceName: string,
    to: string,
    mediaType: string,
    content: Record<string, unknown>,
  ): Promise<SendMessageResult> {
    const url = `${this.baseUrl}/message/sendMedia/${instanceName}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.globalApiKey,
      },
      body: JSON.stringify({
        number: this.normalizePhone(to),
        mediatype: mediaType,
        media: content.url,
        caption: content.caption || '',
        fileName: content.filename || '',
      }),
    });

    const data: any = await response.json();

    if (!response.ok) {
      return { messageId: '', success: false, error: data.message || `HTTP ${response.status}` };
    }

    return {
      messageId: data.key?.id || '',
      success: true,
    };
  }

  /**
   * Disconnect/logout an instance
   */
  async logoutInstance(instanceName: string): Promise<void> {
    const url = `${this.baseUrl}/instance/logout/${instanceName}`;

    await fetch(url, {
      method: 'DELETE',
      headers: { apikey: this.globalApiKey },
    });
  }

  /**
   * Delete an instance
   */
  async deleteInstance(instanceName: string): Promise<void> {
    const url = `${this.baseUrl}/instance/delete/${instanceName}`;

    await fetch(url, {
      method: 'DELETE',
      headers: { apikey: this.globalApiKey },
    });
  }

  /**
   * Normalize phone number: remove non-digits, ensure country code
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }
}
