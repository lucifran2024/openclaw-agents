import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';
import { CardEntity } from './card.entity';

@Entity({ tableName: 'kanban_card_history' })
export class CardHistoryEntity extends TenantBaseEntity {
  @ManyToOne(() => CardEntity, { fieldName: 'card_id' })
  card!: CardEntity;

  @Property({ type: 'varchar', length: 26, nullable: true })
  fromColumnId?: string;

  @Property({ type: 'varchar', length: 26, nullable: true })
  toColumnId?: string;

  @Property({ type: 'varchar', length: 26, nullable: true })
  movedBy?: string;

  @Property({ type: 'timestamptz' })
  movedAt: Date = new Date();

  @Property({ type: 'bigint', nullable: true })
  dwellTimeMs?: number;
}
