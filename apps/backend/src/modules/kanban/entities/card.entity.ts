import { Entity, Property, Enum, ManyToOne } from '@mikro-orm/core';
import { TenantBaseEntity } from '../../../common/database/base.entity';
import { BoardEntity } from './board.entity';
import { ColumnEntity } from './column.entity';
import { SwimlaneEntity } from './swimlane.entity';

export enum CardPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity({ tableName: 'kanban_cards' })
export class CardEntity extends TenantBaseEntity {
  @ManyToOne(() => BoardEntity, { fieldName: 'board_id' })
  board!: BoardEntity;

  @ManyToOne(() => ColumnEntity, { fieldName: 'column_id' })
  column!: ColumnEntity;

  @ManyToOne(() => SwimlaneEntity, { fieldName: 'swimlane_id', nullable: true })
  swimlane?: SwimlaneEntity;

  @Property({ type: 'varchar', length: 26, nullable: true })
  conversationId?: string;

  @Property({ type: 'varchar', length: 26, nullable: true })
  contactId?: string;

  @Property()
  title!: string;

  @Property({ nullable: true, type: 'text' })
  description?: string;

  @Enum(() => CardPriority)
  priority: CardPriority = CardPriority.MEDIUM;

  @Property({ type: 'varchar', length: 26, nullable: true })
  assignedTo?: string;

  @Property({ type: 'timestamptz', nullable: true })
  dueDate?: Date;

  @Property()
  position: number = 0;

  @Property({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown> = {};
}
