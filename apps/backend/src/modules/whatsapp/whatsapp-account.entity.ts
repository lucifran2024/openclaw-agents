import { Entity, Property, Index, Enum } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../common/database/base.entity';

export enum QualityRating {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
}

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

export enum WhatsAppProvider {
  META = 'meta',
  EVOLUTION = 'evolution',
}

@Entity({ tableName: 'whatsapp_accounts' })
@Index({ properties: ['tenantId', 'phoneNumberId'] })
@Index({ properties: ['tenantId', 'status'] })
@Index({ properties: ['tenantId', 'provider'] })
export class WhatsAppAccountEntity extends TenantBaseEntity {
  @Enum({ items: () => WhatsAppProvider, default: WhatsAppProvider.META })
  provider: WhatsAppProvider = WhatsAppProvider.META;

  @Property({ type: 'varchar', length: 255, nullable: true })
  evolutionInstanceName?: string;

  @Property({ type: 'varchar', length: 100 })
  wabaId!: string;

  @Property({ type: 'varchar', length: 100 })
  phoneNumberId!: string;

  @Property({ type: 'varchar', length: 50 })
  phoneNumber!: string;

  @Property({ type: 'varchar', length: 255 })
  displayName!: string;

  @Enum({ items: () => QualityRating, default: QualityRating.GREEN })
  qualityRating: QualityRating = QualityRating.GREEN;

  @Property({ type: 'varchar', length: 50, default: '1000' })
  messagingTier: string = '1000';

  @Enum({ items: () => AccountStatus, default: AccountStatus.PENDING })
  status: AccountStatus = AccountStatus.PENDING;

  @Property({ type: 'text' })
  accessTokenEncrypted!: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  webhookSecret?: string;

  @Property({ type: 'jsonb', default: '{}' })
  capabilities: Record<string, unknown> = {};
}
