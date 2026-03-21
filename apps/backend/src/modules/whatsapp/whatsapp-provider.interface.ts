export interface SendMessageParams {
  to: string;
  type: 'text' | 'template' | 'image' | 'video' | 'audio' | 'document' | 'interactive' | 'location' | 'reaction';
  content: Record<string, unknown>;
}

export interface SendMessageResult {
  messageId: string;
  success: boolean;
  error?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  state: 'open' | 'close' | 'connecting' | 'unknown';
  phoneNumber?: string;
  name?: string;
}

export interface QrCodeResult {
  qrCode: string; // base64 image or data URI
  pairingCode?: string;
}

export interface WhatsAppProviderInterface {
  sendMessage(accountIdentifier: string, accessToken: string, params: SendMessageParams): Promise<SendMessageResult>;
  getConnectionStatus(instanceName: string, apiKey: string): Promise<ConnectionStatus>;
}
