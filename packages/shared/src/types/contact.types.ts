export type ContactStatus = 'active' | 'inactive' | 'blocked';
export type ConsentStatus = 'opted_in' | 'opted_out' | 'pending';
export type FunnelStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Contact {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  whatsappId?: string;
  avatarUrl?: string;
  leadScore: number;
  status: ContactStatus;
  funnelStage?: FunnelStage;
  source?: string;
  consentStatus: ConsentStatus;
  customFields: Record<string, unknown>;
  estimatedValue?: number;
  lastInteractionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
