import { Entity, Property, Index, Enum } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../common/database/base.entity';

export enum TemplateCategory {
  MARKETING = 'marketing',
  UTILITY = 'utility',
  AUTHENTICATION = 'authentication',
  SERVICE = 'service',
}

export enum TemplateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity({ tableName: 'whatsapp_templates' })
@Index({ properties: ['tenantId', 'whatsappAccountId'] })
@Index({ properties: ['tenantId', 'name', 'language'] })
export class WhatsAppTemplateEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 26 })
  whatsappAccountId!: string;

  @Property({ type: 'varchar', length: 100 })
  metaTemplateId!: string;

  @Property({ type: 'varchar', length: 255 })
  name!: string;

  @Property({ type: 'varchar', length: 10, default: 'pt_BR' })
  language: string = 'pt_BR';

  @Enum({ items: () => TemplateCategory })
  category!: TemplateCategory;

  @Enum({ items: () => TemplateStatus, default: TemplateStatus.PENDING })
  status: TemplateStatus = TemplateStatus.PENDING;

  @Property({ type: 'jsonb', default: '[]' })
  components: Record<string, unknown>[] = [];
}
