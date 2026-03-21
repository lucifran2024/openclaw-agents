import { Entity, Property, Index } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';

@Entity({ tableName: 'opt_outs' })
@Index({ properties: ['tenantId', 'contactId'] })
@Index({ properties: ['tenantId', 'channel'] })
export class OptOutEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 26 })
  contactId!: string;

  @Property({ type: 'varchar', length: 50, default: 'whatsapp' })
  channel: string = 'whatsapp';

  @Property({ type: 'timestamptz' })
  optedOutAt: Date = new Date();

  @Property({ type: 'text', nullable: true })
  reason?: string;
}
