import { Entity, Property, Index, Enum } from '@mikro-orm/core';
import { SoftDeletableEntity } from '../../common/database/base.entity';

export enum ContactStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

export enum FunnelStage {
  LEAD = 'lead',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  WON = 'won',
  LOST = 'lost',
}

export enum ConsentStatus {
  OPTED_IN = 'opted_in',
  OPTED_OUT = 'opted_out',
  PENDING = 'pending',
}

@Entity({ tableName: 'contacts' })
@Index({ properties: ['tenantId', 'phone'] })
@Index({ properties: ['tenantId', 'email'] })
@Index({ properties: ['tenantId', 'whatsappId'] })
@Index({ expression: 'CREATE INDEX idx_contacts_tenant_lead_score ON contacts (tenant_id, lead_score DESC)' })
export class ContactEntity extends SoftDeletableEntity {
  @Property({ type: 'varchar', length: 255 })
  name!: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Property({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Property({ type: 'varchar', length: 100, nullable: true })
  whatsappId?: string;

  @Property({ type: 'varchar', length: 500, nullable: true })
  avatarUrl?: string;

  @Property({ type: 'int', default: 0 })
  leadScore: number = 0;

  @Enum({ items: () => ContactStatus, default: ContactStatus.ACTIVE })
  status: ContactStatus = ContactStatus.ACTIVE;

  @Enum({ items: () => FunnelStage, nullable: true })
  funnelStage?: FunnelStage;

  @Property({ type: 'varchar', length: 100, nullable: true })
  source?: string;

  @Enum({ items: () => ConsentStatus, default: ConsentStatus.PENDING })
  consentStatus: ConsentStatus = ConsentStatus.PENDING;

  @Property({ type: 'jsonb', default: '{}' })
  customFields: Record<string, unknown> = {};

  @Property({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  estimatedValue?: string;

  @Property({ type: 'timestamptz', nullable: true })
  lastInteractionAt?: Date;
}
