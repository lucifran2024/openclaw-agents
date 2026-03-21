export type ConversationStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type ConversationChannel = 'whatsapp' | 'email' | 'webchat' | 'telegram' | 'instagram';
export type ConversationType = 'direct' | 'channel' | 'group';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Conversation {
  id: string;
  tenantId: string;
  contactId: string;
  channel: ConversationChannel;
  channelId?: string;
  type: ConversationType;
  status: ConversationStatus;
  priority: Priority;
  assignedTo?: string;
  teamId?: string;
  slaPolicyId?: string;
  slaBreached: boolean;
  sessionExpiresAt?: Date;
  lastMessageAt?: Date;
  messageCount: number;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}
