export type SenderType = 'contact' | 'agent' | 'bot' | 'system';
export type ContentType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'template' | 'interactive' | 'location' | 'sticker' | 'reaction';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageSource = 'webhook' | 'import' | 'migration';

export interface Message {
  id: string;
  tenantId: string;
  conversationId: string;
  senderType: SenderType;
  senderId?: string;
  contentType: ContentType;
  content: MessageContent;
  externalId?: string;
  status: MessageStatus;
  errorCode?: string;
  idempotencyKey?: string;
  source: MessageSource;
  imported: boolean;
  createdAt: Date;
}

export interface MessageContent {
  text?: string;
  mediaUrl?: string;
  mimeType?: string;
  fileName?: string;
  caption?: string;
  templateName?: string;
  templateParams?: Record<string, string>;
  buttons?: Array<{ id: string; title: string }>;
  listItems?: Array<{ id: string; title: string; description?: string }>;
  latitude?: number;
  longitude?: number;
  emoji?: string;
}
