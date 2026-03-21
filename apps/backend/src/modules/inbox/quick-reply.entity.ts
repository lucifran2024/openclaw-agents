import { Entity, Property } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../common/database/base.entity';

@Entity({ tableName: 'quick_replies' })
export class QuickReplyEntity extends TenantBaseEntity {
  @Property({ type: 'varchar' })
  shortcut!: string;

  @Property({ type: 'text' })
  content!: string;

  @Property({ type: 'varchar', length: 26 })
  createdBy!: string;
}
