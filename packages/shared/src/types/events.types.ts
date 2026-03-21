export interface DomainEvent<T = unknown> {
  eventId: string;
  eventType: string;
  tenantId: string;
  timestamp: Date;
  payload: T;
  version: number;
}

// Conversation events
export interface ConversationCreatedPayload {
  conversationId: string;
  contactId: string;
  channel: string;
}

export interface MessageReceivedPayload {
  messageId: string;
  conversationId: string;
  senderType: string;
  contentType: string;
}

export interface ConversationAssignedPayload {
  conversationId: string;
  assignedTo: string;
  assignedBy?: string;
}

// Kanban events
export interface CardMovedPayload {
  cardId: string;
  boardId: string;
  fromColumnId: string;
  toColumnId: string;
  movedBy: string;
}

// Campaign events
export interface CampaignStartedPayload {
  campaignId: string;
  segmentId: string;
  totalContacts: number;
}

export interface CampaignMessageSentPayload {
  campaignId: string;
  contactId: string;
  messageId: string;
  status: string;
}

// Scheduling events
export interface AppointmentCreatedPayload {
  appointmentId: string;
  contactId: string;
  resourceId: string;
  startsAt: Date;
}

export const EventTypes = {
  CONVERSATION_CREATED: 'conversation.created',
  MESSAGE_RECEIVED: 'message.received',
  MESSAGE_SENT: 'message.sent',
  CONVERSATION_ASSIGNED: 'conversation.assigned',
  CONVERSATION_RESOLVED: 'conversation.resolved',
  CARD_MOVED: 'kanban.card.moved',
  CARD_CREATED: 'kanban.card.created',
  CAMPAIGN_STARTED: 'campaign.started',
  CAMPAIGN_COMPLETED: 'campaign.completed',
  CAMPAIGN_MESSAGE_SENT: 'campaign.message.sent',
  APPOINTMENT_CREATED: 'scheduling.appointment.created',
  APPOINTMENT_CANCELLED: 'scheduling.appointment.cancelled',
  CONTACT_CREATED: 'contact.created',
  CONTACT_UPDATED: 'contact.updated',
} as const;
