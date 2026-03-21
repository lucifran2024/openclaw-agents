import { Entity, Property } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../common/database/base.entity';

@Entity({ tableName: 'internal_notes' })
export class InternalNoteEntity extends TenantBaseEntity {
  @Property({ type: 'varchar', length: 26 })
  conversationId!: string;

  @Property({ type: 'varchar', length: 26 })
  userId!: string;

  @Property({ type: 'text' })
  content!: string;

  @Property({ type: 'jsonb', default: '[]' })
  mentionedUsers: string[] = [];
}
